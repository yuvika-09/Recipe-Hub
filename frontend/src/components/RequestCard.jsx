export default function RequestCard({
  request,
  activeTab,
  approve,
  reject,
  view
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

      {request.deleteReason && (
        <p className="reject-reason">
          Delete reason: {request.deleteReason}
        </p>
      )}

      {request.rejectionReason && (
        <p className="reject-reason">
          Rejection reason: {request.rejectionReason}
        </p>
      )}

      <div className="actions">
        <button
          className="rate-btn"
          onClick={() => view(request)}
        >
          View Request
        </button>

        {activeTab === "PENDING" && (
          <>
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
          </>
        )}
      </div>

    </div>
  );
}