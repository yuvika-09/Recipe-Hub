import { useEffect, useState } from "react";
import API from "../services/api";
import RequestCard from "../components/RequestCard";


export default function AdminDashboard() {

    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState("PENDING");

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    async function fetchRequests() {
        const res = await API.get(
            `/recipes/requests/${activeTab}`
        );

        setRequests(res.data);
    }

    async function approve(id) {

        await API.put(`/recipes/requests/approve/${id}`);

        setRequests(prev =>
            prev.filter(r => r._id !== id)
        );
    }

    async function reject(id) {

        const reason = prompt("Reason for rejection:");

        if (!reason) return;

        await API.put(
            `/recipes/requests/reject/${id}`,
            { reason }
        );

        setRequests(prev =>
            prev.filter(r => r._id !== id)
        );
    }

    return (
        <div className="admin-container">

            <h2>Admin Requests</h2>

            {/* TABS */}
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

            {/* REQUEST CARDS */}
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
                        reject={reject}
                    />
                ))}


            </div>

        </div>
    );
}
