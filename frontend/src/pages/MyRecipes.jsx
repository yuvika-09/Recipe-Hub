import { useEffect, useState, useContext, useCallback } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";
import { useNavigate } from "react-router-dom";

export default function MyRecipes() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [requests, setRequests] = useState([]);
  const [myRecipes, setMyRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState("RECIPES");

  const loadData = useCallback(async () => {
    if (!user) return;

    const [requestRes, recipeRes] = await Promise.all([
      API.get(`/recipes/requests/user/${user.username}`),
      API.get(`/recipes/user/${user.username}`)
    ]);

    setRequests(requestRes.data);
    setMyRecipes(recipeRes.data);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  async function requestDelete(recipeId) {
    await API.post("/recipes/requests/delete", {
      recipeId,
      requestedBy: user.username
    });

    alert("Delete request sent to admin");
    loadData();
  }

  return (
    <div className="container">
      <h2>My Recipes</h2>

      <div className="tabs">
        <button
          className={activeTab === "RECIPES" ? "active" : ""}
          onClick={() => setActiveTab("RECIPES")}
        >
          My Approved Recipes
        </button>

        <button
          className={activeTab === "REQUESTS" ? "active" : ""}
          onClick={() => setActiveTab("REQUESTS")}
        >
          My Requests
        </button>
      </div>

      {activeTab === "RECIPES" && (
        <div className="request-grid">
          {myRecipes.length === 0 && (
            <p>No approved recipes yet</p>
          )}

          {myRecipes.map(recipe => (
            <div className="request-card" key={recipe._id}>
              <h3>{recipe.name}</h3>
              <p>Likes: {recipe.likes || 0}</p>
              <p>Rating: {Number(recipe.avgRating || 0).toFixed(1)}</p>

              <div className="actions">
                <button
                  className="approve-btn"
                  onClick={() => navigate(`/recipe/${recipe._id}`)}
                >
                  Request Update
                </button>

                <button
                  className="reject-btn"
                  onClick={() => requestDelete(recipe._id)}
                >
                  Request Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "REQUESTS" && (
        <div className="request-grid">
          {requests.length === 0 && (
            <p>No requests yet</p>
          )}

          {requests.map(r => (
            <div className="request-card" key={r._id}>
              <h3>{r.data?.name || "Recipe Request"}</h3>

              <p>
                Status:
                <span className={`status ${r.status}`}>
                  {r.status}
                </span>
              </p>

              <p>Type: {r.type}</p>

              {r.recipeId && (
                <button
                  className="rate-btn"
                  onClick={() => navigate(`/recipe/${r.recipeId}`)}
                >
                  Open Recipe
                </button>
              )}

              {r.rejectionReason && (
                <p className="reject-reason">
                  Reason: {r.rejectionReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}