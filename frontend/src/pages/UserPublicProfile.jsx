import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";

export default function UserPublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    API.get(`/auth/users/${username}`).then(res => setProfile(res.data));
    API.get(`/recipes/user/${username}`).then(res => setRecipes(res.data));
  }, [username, user, navigate]);

  return (
    <div className="container">
      <h2>{username}'s Profile</h2>

      {profile && (
        <div className="request-card" style={{ marginBottom: "16px" }}>
          <p><b>Username:</b> {profile.username}</p>
          <p><b>Email:</b> {profile.email}</p>
        </div>
      )}

      <h3>Recipes by {username}</h3>
      <div className="request-grid">
        {recipes.length === 0 && <p>No recipes yet.</p>}

        {recipes.map(r => (
          <div className="request-card" key={r._id}>
            <h4>{r.name}</h4>
            <p>⏱️ {r.prepTime || 0} mins · 🍽️ {r.servings || 0} servings</p>
            <p>❤️ {r.likes || 0} · ⭐ {Number(r.avgRating || 0).toFixed(1)}</p>
            <Link className="author-link" to={`/recipe/${r._id}`}>Open recipe</Link>
          </div>
        ))}
      </div>
    </div>
  );
}