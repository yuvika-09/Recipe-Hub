import { useEffect, useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function MyRecipes() {
  const navigate = useNavigate();


  const { user } = useContext(AuthContext);

  const [requests, setRequests] = useState([]);

  useEffect(() => {

    if (!user) return;

    API.get(`/recipes/requests/user/${user.username}`)
      .then(res => setRequests(res.data));

  }, [user]);

  return (
    <div className="container">

      <h2>My Recipes</h2>

      {requests.length === 0 && (
        <p>No recipes yet</p>
      )}

      <div className="request-grid">

        {requests.map(r => (
          <div
            className="request-card" key={r._id} onClick={() => navigate(`/recipe/${r.recipeId || r._id}`)}>

            <h3>{r.data?.name}</h3>

            <p>
              Status:
              <span className={`status ${r.status}`}>
                {r.status}
              </span>
            </p>

            {r.rejectionReason && (
              <p className="reject-reason">
                Reason: {r.rejectionReason}
              </p>
            )}

          </div>
        ))}

      </div>

    </div>
  );
}
