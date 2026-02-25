import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import RequestCard from "../components/RequestCard";
import { displayUsername } from "../utils/UserDisplay";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [stats, setStats] = useState({
    approvedRecipes: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    usersCount: 0
  });
  const [approvedRecipes, setApprovedRecipes] = useState([]);
  const [reportedRecipes, setReportedRecipes] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);

  const isUsersPage = location.pathname.includes("/admin/users");
  const isRequestsPage = location.pathname.includes("/admin/requests");
  const isHomePage = location.pathname.includes("/admin/home") || location.pathname === "/admin";

  const fetchRequests = useCallback(async () => {
    const res = await API.get(`/recipes/requests/${activeTab}`);
    setRequests(res.data);
  }, [activeTab]);

  const fetchUsers = useCallback(async () => {
    const res = await API.get("/auth/users");
    setUsers(res.data);
  }, []);

  const fetchStats = useCallback(async () => {
    const [statsRes, usersRes, approvedRes, reportedRecipesRes, reportedCommentsRes] = await Promise.all([
      API.get("/recipes/stats/dashboard"),
      API.get("/auth/users"),
      API.get("/recipes/admin/approved"),
      API.get("/recipes/admin/reported"),
      API.get("/comments/admin/reported")
    ]);

    setStats({
      ...statsRes.data,
      usersCount: usersRes.data.length
    });

    setApprovedRecipes(approvedRes.data);
    setReportedRecipes(reportedRecipesRes.data);
    setReportedComments(reportedCommentsRes.data);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isUsersPage) {
        fetchUsers();
        return;
      }

      if (isHomePage && !isRequestsPage) {
        fetchStats();
        return;
      }

      fetchRequests();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchRequests, fetchUsers, fetchStats, isUsersPage, isHomePage, isRequestsPage]);

  async function approve(id) {
    await API.put(`/recipes/requests/approve/${id}`);
    setRequests(prev => prev.filter(r => r._id !== id));
    if (selectedRequest?._id === id) setSelectedRequest(null);
    fetchStats();
  }

  async function submitReject() {
    if (!reason.trim()) return;

    await API.put(`/recipes/requests/reject/${rejectingId}`, { reason });

    setRequests(prev => prev.filter(r => r._id !== rejectingId));
    setRejectingId(null);
    setReason("");
    fetchStats();
  }

  async function deleteUser(username) {
    const ok = window.confirm(`Delete account for ${username}?`);
    if (!ok) return;

    await API.delete(`/auth/users/${username}`);
    fetchUsers();
    fetchStats();
  }

  async function cancelScheduledDelete(recipeId) {
    await API.put(`/recipes/admin/cancel-delete/${recipeId}`);
    fetchStats();
  }

  async function deleteComment(commentId) {
    await API.delete(`/comments/${commentId}`, {
      data: {
        requestedBy: "admin",
        role: "ADMIN"
      }
    });

    fetchStats();
  }

  if (isUsersPage) {
    return (
      <div className="admin-container">
        <h2>Users</h2>
        <div className="request-grid">
          {users.map(u => (
            <div className="request-card" key={u._id}>
              <h3>{u.username}</h3>
              <p>{u.email}</p>

              <div className="actions">
                <button className="rate-btn" onClick={() => navigate(`/users/${u.username}`)}>
                  View Account
                </button>
                <button className="reject-btn" onClick={() => deleteUser(u.username)}>
                  Delete User
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isHomePage && !isRequestsPage) {
    const approvalRate = (stats.approvedRequests + stats.rejectedRequests) > 0
      ? Math.round((stats.approvedRequests / (stats.approvedRequests + stats.rejectedRequests)) * 100)
      : 0;

    const scheduledRecipes = approvedRecipes.filter((recipe) => recipe.isDeletionScheduled);

    return (
      <div className="admin-container">
        <h2>Admin Home Insights</h2>
        <p className="insight-subtitle">Live analytical overview of platform performance</p>

        <div className="insights-grid">
          <div className="insight-card pending"><h3>Pending Requests</h3><p>{stats.pendingRequests}</p><small>Needs moderation action</small></div>
          <div className="insight-card approved"><h3>Approved Requests</h3><p>{stats.approvedRequests}</p><small>Content successfully published</small></div>
          <div className="insight-card rejected"><h3>Rejected Requests</h3><p>{stats.rejectedRequests}</p><small>Quality/compliance rejections</small></div>
          <div className="insight-card"><h3>Approved Recipes</h3><p>{stats.approvedRecipes}</p><small>Total live recipes</small></div>
          <div className="insight-card"><h3>Total Users</h3><p>{stats.usersCount}</p><small>Registered accounts</small></div>
          <div className="insight-card"><h3>Approval Rate</h3><p>{approvalRate}%</p><small>Approved vs reviewed</small></div>
        </div>

        <h3 style={{ marginTop: "22px" }}>Scheduled for Deletion</h3>
        <p className="insight-subtitle">Track recipes with active deletion timelines and cancel when needed</p>
        <div className="request-grid">
          {scheduledRecipes.length === 0 && <p>No recipes are currently scheduled for deletion.</p>}
          {scheduledRecipes.map((recipe) => (
            <div className="request-card" key={recipe._id}>
              <h4>{recipe.name}</h4>
              <p>By: {displayUsername(recipe.createdBy)}</p>
              <p>Delete on: {new Date(recipe.deletionScheduledFor).toLocaleString()}</p>
              <p>Reason: {recipe.deletionReason || "No reason provided"}</p>
              <div className="actions">
                <button className="rate-btn" onClick={() => navigate(`/recipe/${recipe._id}`)}>
                  View Full Recipe
                </button>
                <button className="approve-btn" onClick={() => cancelScheduledDelete(recipe._id)}>
                  Cancel Deletion
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <h3 style={{ marginTop: "22px" }}>Reported Recipes</h3>
        <div className="request-grid">
          {reportedRecipes.length === 0 && <p>No reported recipes.</p>}
          {reportedRecipes.map((recipe) => (
            <div className="request-card" key={`report-recipe-${recipe._id}`}>
              <h4>{recipe.name}</h4>
              <p>Reports: {recipe.reportEntries?.length || 0}</p>
              <div className="actions">
                <button className="rate-btn" onClick={() => navigate(`/recipe/${recipe._id}`)}>
                  Review Recipe
                </button>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: "22px" }}>Reported Comments</h3>
        <div className="request-grid">
          {reportedComments.length === 0 && <p>No reported comments.</p>}
          {reportedComments.map((comment) => (
            <div className="request-card" key={`report-comment-${comment._id}`}>
              <p><b>By:</b> {displayUsername(comment.username)}</p>
              <p>{comment.text}</p>
              <p>Reports: {comment.reports?.length || 0}</p>
              <div className="actions">
                <button className="rate-btn" onClick={() => navigate(`/recipe/${comment.recipeId}`)}>
                  Open Recipe
                </button>
                {!comment.isDeleted && (
                  <button className="reject-btn" onClick={() => deleteComment(comment._id)}>
                    Delete Comment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h2>Admin Requests</h2>

      <div className="tabs">
        {["PENDING", "APPROVED", "REJECTED"].map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="request-grid">
        {requests.length === 0 && (
          <p>No requests found</p>
        )}

        {requests.map(r => (
          <RequestCard
            key={r._id}
            request={r}
            activeTab={activeTab}
            approve={approve}
            reject={(id) => setRejectingId(id)}
            view={(req) => setSelectedRequest(req)}
          />
        ))}
      </div>

      {selectedRequest && (
        <div className="reject-modal">
          <div className="reject-modal-card">
            <h3>Request Review</h3>
            <p><b>Type:</b> {selectedRequest.type}</p>
            <p><b>By:</b> {selectedRequest.requestedBy}</p>
            <p><b>Name:</b> {selectedRequest.data?.name || "-"}</p>
            {selectedRequest.data?.imageUrl && (
              <img className="details-image" src={selectedRequest.data.imageUrl} alt="Requested recipe" />
            )}
            <p><b>Prep Time:</b> {selectedRequest.data?.prepTime || 0} mins</p>
            <p><b>Servings:</b> {selectedRequest.data?.servings || 0}</p>
            <p><b>Ingredients:</b> {Array.isArray(selectedRequest.data?.ingredients)
              ? selectedRequest.data.ingredients.join(", ")
              : selectedRequest.data?.ingredients || "-"}</p>
            <p><b>Steps:</b> {selectedRequest.data?.steps || "-"}</p>
            {selectedRequest.deleteReason && <p><b>Delete reason:</b> {selectedRequest.deleteReason}</p>}

            <div className="actions">
              {selectedRequest.status === "PENDING" && (
                <>
                  <button className="approve-btn" onClick={() => approve(selectedRequest._id)}>Approve</button>
                  <button className="reject-btn" onClick={() => setRejectingId(selectedRequest._id)}>Reject</button>
                </>
              )}
              <button className="rate-btn" onClick={() => setSelectedRequest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {rejectingId && (
        <div className="reject-modal">
          <div className="reject-modal-card">
            <h3>Reject request</h3>
            <textarea
              placeholder="Enter rejection reason for user"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="actions">
              <button className="reject-btn" onClick={submitReject}>Submit reject</button>
              <button className="rate-btn" onClick={() => setRejectingId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}