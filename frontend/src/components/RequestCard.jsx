export default function RequestCard({
  request,
  activeTab,
  approve,
  reject
}) {

  return (
    <div className="request-card">
      <span className="type-badge">
        {request.type}
      </span>

      <h3>{request.data?.name || "Recipe request"}</h3>

      <p>
        By: <b>{request.requestedBy}</b>
      </p>

      {request.rejectionReason && (
        <p className="reject-reason">
          Reason: {request.rejectionReason}
        </p>
      )}

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