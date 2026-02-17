import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function RequestCard({
  request,
  activeTab,
  approve,
  reject
}) {

  return (
    <div className="request-card">

      {/* Request Type */}
      <span className="type-badge">
        {request.type}
      </span>

      <h3>{request.data?.name}</h3>

      <p>
        By: <b>{request.requestedBy}</b>
      </p>

      {/* Rejection reason */}
      {request.rejectionReason && (
        <p className="reject-reason">
          Reason: {request.rejectionReason}
        </p>
      )}

      {/* Actions */}
      {activeTab === "PENDING" && (
        <div className="actions">

          <button
            className="approve-btn"
            onClick={() => approve(request._id)}
          >
            Approve
          </button>

          <button
            className="reject-btn"
            onClick={() => reject(request._id)}
          >
            Reject
          </button>

        </div>
      )}

    </div>
  );
}
