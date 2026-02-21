import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import RequestCard from "../components/RequestCard";

export default function AdminDashboard() {

  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");

  const isUsersPage = location.pathname.includes("/admin/users");
  const isRequestsPage = location.pathname.includes("/admin/requests");
  const isHomePage = location.pathname.includes("/admin/home") || location.pathname === "/admin";

  const fetchRequests = useCallback(async () => {
    const res = await API.get(`/recipes/requests/${activeTab}`);
    setRequests(res.data);
  }, [activeTab]);

  useEffect(() => {
    if (isUsersPage) {
      API.get("/auth/users").then(res => setUsers(res.data));
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
  }, [fetchRequests, isUsersPage]);

  async function approve(id) {
    await API.put(`/recipes/requests/approve/${id}`);
    setRequests(prev => prev.filter(r => r._id !== id));
  }

  async function submitReject() {
    if (!reason.trim()) return;

    await API.put(`/recipes/requests/reject/${rejectingId}`, { reason });

    setRequests(prev => prev.filter(r => r._id !== rejectingId));
    setRejectingId(null);
    setReason("");
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
          />
        ))}

      </div>

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