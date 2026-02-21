import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";
import Comments from "../components/Comments";

export default function RecipeDetails() {

  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [recipe, setRecipe] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    API.get(`/recipes/${id}`)
      .then(res => {
        setRecipe(res.data);
        setDraft(res.data);
      });
  }, [id]);

  async function requestUpdate() {
    await API.post("/recipes/requests/update", {
      recipeId: id,
      requestedBy: user.username,
      data: {
        ...draft,
        ingredients: Array.isArray(draft.ingredients)
          ? draft.ingredients
          : String(draft.ingredients)
            .split(",")
            .map(i => i.trim())
            .filter(Boolean)
      }
    });

    alert("Update request sent");
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

  if (!recipe || !draft) return <p>Loading...</p>;

  const isOwner = user?.username === recipe.createdBy;

  return (
    <div className="container details-page">

      <h2>{recipe.name}</h2>
      <p>
        By{" "}
        <Link className="author-link" to={`/users/${recipe.createdBy}`}>
          {recipe.createdBy}
        </Link>
      </p>

      {recipe.imageUrl && (
        <img className="details-image" src={recipe.imageUrl} alt={recipe.name} />
      )}

      <h4>Ingredients</h4>
      {isOwner ? (
        <textarea
          value={Array.isArray(draft.ingredients) ? draft.ingredients.join(", ") : draft.ingredients}
          onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
        />
      ) : (
        <p>{Array.isArray(recipe.ingredients) ? recipe.ingredients.join(", ") : recipe.ingredients}</p>
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

      <Comments recipeId={id} />

    </div>
  );
}