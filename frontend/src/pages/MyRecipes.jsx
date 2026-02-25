import { useEffect, useState, useContext, useCallback } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

export default function MyRecipes() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [requests, setRequests] = useState([]);
  const [myRecipes, setMyRecipes] = useState([]);
const [likedRecipes, setLikedRecipes] = useState([]);
  const tabFromQuery = searchParams.get("tab");
  const initialTab = ["REQUESTS", "LIKED"].includes(tabFromQuery) ? tabFromQuery : "RECIPES";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [now, setNow] = useState(() => Date.now());

  // Load Data
const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [requestRes, recipeRes, likedRes] = await Promise.all([
        API.get(`/recipes/requests/user/${user.username}`),
        API.get(`/recipes/user/${user.username}`),
        API.get(`/recipes/liked/${user.username}`)
      ]);

      setRequests(requestRes.data);
      setMyRecipes(recipeRes.data);
      setLikedRecipes(likedRes.data);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }, [user]);

  // Initial load + polling
  useEffect(() => {
    const initialLoadTimer = setTimeout(() => {
      loadData();
    }, 0);

    const intervalId = setInterval(() => {
      loadData();
    }, 8000);

    return () => {
      clearTimeout(initialLoadTimer);
      clearInterval(intervalId);
    };
  }, [loadData]);

  // Live countdown timer
  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // Handle new request from navigation state
  useEffect(() => {
    if (location.state?.newRequest) {
      const timerId = setTimeout(() => {
        setRequests((prev) => [location.state.newRequest, ...prev]);
        setActiveTab("REQUESTS");
      }, 0);

      return () => clearTimeout(timerId);
    }

    return undefined;
  }, [location.state]);

  // Countdown Formatter
  function formatCountdown(dateValue) {
    if (!dateValue) return null;

    const targetTime = new Date(dateValue).getTime();
    if (Number.isNaN(targetTime)) return null;

    const diffMs = targetTime - now;

    if (diffMs <= 0) {
      return "Deletion time reached. Waiting for review.";
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  // Request Delete
  async function requestDelete(recipeId) {
    const reason = prompt("Reason for deletion request:");

    if (!reason || !reason.trim()) return;

    try {
      const res = await API.post("/recipes/requests/delete", {
        recipeId,
        requestedBy: user.username,
        reason
      });

      setRequests((prev) => [res.data, ...prev]);
      setActiveTab("REQUESTS");
    } catch (err) {
      console.error("Delete request failed:", err);
    }
  }

  return (
    <div className="container">
      <h2>My Recipes</h2>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "RECIPES" ? "active" : ""}
          onClick={() => setActiveTab("RECIPES")}
        >
          My Approved Recipes
        </button>

        <button
          className={activeTab === "LIKED" ? "active" : ""}
          onClick={() => setActiveTab("LIKED")}
        >
          My Liked Recipes
        </button>

        <button
          className={activeTab === "REQUESTS" ? "active" : ""}
          onClick={() => setActiveTab("REQUESTS")}
        >
          My Requests
        </button>
      </div>

      {/* ================= RECIPES TAB ================= */}
      {activeTab === "RECIPES" && (
        <div className="request-grid">
          {myRecipes.length === 0 && <p>No approved recipes yet</p>}

          {myRecipes.map((recipe) => {
            const pendingDeleteRequest = requests.find(
              (request) =>
                request.type === "DELETE" &&
                request.status === "PENDING" &&
                String(request.recipeId) === String(recipe._id)
            );

            const deleteCountdown = formatCountdown(
              pendingDeleteRequest?.deleteScheduledFor
            );

            return (
              <div className="request-card" key={recipe._id}>
                <h3>{recipe.name}</h3>

                <p>
                  ⏱️ {recipe.prepTime || 0} mins · 🍽️{" "}
                  {recipe.servings || 0} servings
                </p>

                <p>Likes: {recipe.likes || 0}</p>
                <p>
                  Rating: {Number(recipe.avgRating || 0).toFixed(1)}
                </p>
                {recipe.isDeletionScheduled && (
                  <p className="status-badge warning">
                    Status: delete scheduled on {new Date(recipe.deletionScheduledFor).toLocaleString()}
                  </p>
                )}

                {pendingDeleteRequest && (
                  <p>
                    Deletion request countdown: {deleteCountdown || "Pending"}
                  </p>
                )}

                <div className="actions">
                  <button
                    className="approve-btn"
                    onClick={() =>
                      navigate(`/recipe/${recipe._id}`)
                    }
                  >
                    Request Update
                  </button>

                  <button
                    className="reject-btn"
                    onClick={() =>
                      requestDelete(recipe._id)
                    }
                  >
                    Request Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= LIKED TAB ================= */}
      {activeTab === "LIKED" && (
        <div className="request-grid">
          {likedRecipes.length === 0 && <p>You have not liked any recipes yet.</p>}

          {likedRecipes.map((recipe) => (
            <div className="request-card" key={`liked-${recipe._id}`}>
              <h3>{recipe.name}</h3>
              <p>By: {recipe.createdBy}</p>
              <p>⏱️ {recipe.prepTime || 0} mins · 🍽️ {recipe.servings || 0} servings</p>
              <p>❤️ {recipe.likes || 0} · ⭐ {Number(recipe.avgRating || 0).toFixed(1)} ({recipe.ratingCount || 0})</p>
              <div className="actions">
                <button
                  className="rate-btn"
                  onClick={() => navigate(`/recipe/${recipe._id}`)}
                >
                  Open Recipe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= REQUESTS TAB ================= */}
      {activeTab === "REQUESTS" && (
        <div className="request-grid">
          {requests.length === 0 && <p>No requests yet</p>}

          {requests.map((r) => {
            const isDeletedRequest = r.type === "DELETE" && r.status === "APPROVED";

            return (
              <div className="request-card" key={r._id}>
                <h3>{r.data?.name || "Recipe Request"}</h3>

                <p>
                  Status:{" "}
                  <span className={`status ${isDeletedRequest ? "REJECTED" : r.status}`}>
                    {isDeletedRequest ? "DELETED" : r.status}
                  </span>
                </p>

                <p>Type: {r.type}</p>

                {r.deleteReason && (
                  <p>Delete reason: {r.deleteReason}</p>
                )}

                {r.deleteScheduledFor && (
                  <p>
                    Delete scheduled for:{" "}
                    {new Date(
                      r.deleteScheduledFor
                    ).toLocaleString()}
                  </p>
                )}

                {isDeletedRequest ? (
                  <p className="meta-row">This recipe has been deleted.</p>
                ) : (
                  r.recipeId && (
                    <button
                      className="rate-btn"
                      onClick={() =>
                        navigate(`/recipe/${r.recipeId}`)
                      }
                    >
                      Open Recipe
                    </button>
                  )
                )}

                {r.rejectionReason && (
                  <p className="reject-reason">
                    Reason: {r.rejectionReason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}