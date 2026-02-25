import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";
import Comments from "../components/Comments";
import { displayUsername, isDeletedUser } from "../utils/UserDisplay";

export default function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [recipe, setRecipe] = useState(null);
  const [draft, setDraft] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteHours, setDeleteHours] = useState(24);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    API.get(`/recipes/${id}`)
      .then(res => {
        setRecipe(res.data);
        setDraft(res.data);
      });
  }, [id, user, navigate]);

  async function requestUpdate() {
    await API.post("/recipes/requests/update", {
      recipeId: id,
      requestedBy: user.username,
      data: {
        ...draft,
        prepTime: Number(draft.prepTime) || 0,
        servings: Number(draft.servings) || 0,
        ingredients: Array.isArray(draft.ingredients)
          ? draft.ingredients
          : String(draft.ingredients)
            .split(",")
            .map(i => i.trim())
            .filter(Boolean)
      }
    });

    alert("Update request sent");
    const refreshed = await API.get(`/recipes/${id}`);
    setRecipe(refreshed.data);
    setDraft(refreshed.data);
  }

  async function requestDelete() {
    const reason = prompt("Reason for deletion request:");

    if (!reason || !reason.trim()) {
      return;
    }

    await API.post("/recipes/requests/delete", {
      recipeId: id,
      requestedBy: user.username,
      reason
    });

    alert("Delete request sent");
  }

  async function scheduleDeletionByAdmin() {
    if (!deleteReason.trim()) {
      return;
    }

    await API.put(`/recipes/admin/schedule-delete/${id}`, {
      reason: deleteReason,
      hours: Number(deleteHours),
      admin: user.username || "ADMIN"
    });

    const refreshed = await API.get(`/recipes/${id}`);
    setRecipe(refreshed.data);
    setDraft(refreshed.data);
    setDeleteReason("");
    setDeleteHours(24);
  }

  async function cancelDeletionByAdmin() {
    await API.put(`/recipes/admin/cancel-delete/${id}`);

    const refreshed = await API.get(`/recipes/${id}`);
    setRecipe(refreshed.data);
    setDraft(refreshed.data);
  }

  if (!recipe || !draft) return <p>Loading...</p>;

  const isOwner = user?.username === recipe.createdBy;
  const isAdmin = user?.role === "ADMIN";
  const deletedAuthor = isDeletedUser(recipe.createdBy);

  return (
    <div className="container details-page">
      <button className="back-arrow-btn" onClick={() => navigate(user?.role === "ADMIN" ? "/admin/home" : "/")}>←</button>

      <h2>{recipe.name}</h2>
      <p>
        By{" "}
        {deletedAuthor ? (
          <span>{displayUsername(recipe.createdBy)}</span>
        ) : (
          <Link className="author-link" to={`/users/${recipe.createdBy}`}>
            {displayUsername(recipe.createdBy)}
          </Link>
        )}
      </p>

      {recipe.imageUrl && (
        <img className="details-image" src={recipe.imageUrl} alt={recipe.name} />
      )}

      <p className="meta-row">⏱️ {recipe.prepTime || 0} mins · 🍽️ Serves {recipe.servings || 0}</p>

      {recipe.isDeletionScheduled && (
        <p className="status-badge warning">Status: delete scheduled on {new Date(recipe.deletionScheduledFor).toLocaleString()}</p>
      )}

      {isOwner && (
        <div className="owner-meta-grid">
          <input
            placeholder="Recipe Name"
            value={draft.name || ""}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            placeholder="Image URL"
            value={draft.imageUrl || ""}
            onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
          />
          <input
            placeholder="Prep time (mins)"
            type="number"
            value={draft.prepTime || 0}
            onChange={(e) => setDraft({ ...draft, prepTime: Number(e.target.value) })}
          />
          <input
            placeholder="Servings"
            type="number"
            value={draft.servings || 0}
            onChange={(e) => setDraft({ ...draft, servings: Number(e.target.value) })}
          />
        </div>
      )}

      <h4>Ingredients</h4>
      {isOwner ? (
        <textarea
          value={Array.isArray(draft.ingredients) ? draft.ingredients.join(", ") : draft.ingredients}
          onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
        />
      ) : (
        <ul className="ingredient-list">
          {(Array.isArray(recipe.ingredients) ? recipe.ingredients : String(recipe.ingredients || "").split(",")).map((it, idx) => (
            <li key={`${it}-${idx}`}>{String(it).trim()}</li>
          ))}
        </ul>
      )}

      <h4>Steps</h4>
      {isOwner ? (
        <textarea
          value={draft.steps}
          onChange={(e) => setDraft({ ...draft, steps: e.target.value })}
        />
      ) : (
        <p className="recipe-steps-text">{recipe.steps}</p>
      )}

      {isOwner && (
        <div className="actions" style={{ marginTop: "20px" }}>
          <button className="approve-btn" onClick={requestUpdate}>
            Request Update
          </button>

          <button
            className="reject-btn"
            onClick={requestDelete}
          >
            Request Delete
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="admin-delete-panel">
          <h4>Deletion Controls</h4>
          {recipe.isDeletionScheduled ? (
            <>
              <p className="meta-row">Scheduled for: {new Date(recipe.deletionScheduledFor).toLocaleString()}</p>
              <p className="meta-row">Reason: {recipe.deletionReason || "No reason provided"}</p>
              <button className="approve-btn" onClick={cancelDeletionByAdmin}>Cancel Deletion</button>
            </>
          ) : (
            <>
              <textarea
                placeholder="Reason to notify user"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
              <input
                type="number"
                value={deleteHours}
                onChange={(e) => setDeleteHours(e.target.value)}
                placeholder="Delete after hours"
              />
              <button className="reject-btn" onClick={scheduleDeletionByAdmin}>Schedule Deletion</button>
            </>
          )}
        </div>
      )}

      <Comments recipeId={id} />
    </div>
  );
}