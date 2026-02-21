import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import RequestCard from "../components/RequestCard";

export default function AdminDashboard() {

  const location = useLocation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isUsersPage) {
        fetchUsers();
        return;
      }

      fetchRequests();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchRequests, fetchUsers, isUsersPage]);

  async function approve(id) {
    await API.put(`/recipes/requests/approve/${id}`);
    setRequests(prev => prev.filter(r => r._id !== id));
    if (selectedRequest?._id === id) setSelectedRequest(null);
  }

  async function submitReject() {
    if (!reason.trim()) return;

    await API.put(`/recipes/requests/reject/${rejectingId}`, { reason });

    setRequests(prev => prev.filter(r => r._id !== rejectingId));
    setRejectingId(null);
    setReason("");
  }

  async function deleteUser(username) {
    const ok = window.confirm(`Delete account for ${username}?`);
    if (!ok) return;

    await API.delete(`/auth/users/${username}`);
    fetchUsers();
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
    const pendingCount = requests.filter(r => r.status === "PENDING").length;
    const approvedCount = requests.filter(r => r.status === "APPROVED").length;

    return (
      <div className="admin-container">
        <h2>Admin Home</h2>
        <div className="request-grid">
          <div className="request-card"><h3>Pending Requests</h3><p>{pendingCount}</p></div>
          <div className="request-card"><h3>Approved Requests</h3><p>{approvedCount}</p></div>
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