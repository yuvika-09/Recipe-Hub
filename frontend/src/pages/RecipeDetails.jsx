import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";

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
    await API.post("/recipes/requests/delete", {
      recipeId: id,
      requestedBy: user.username
    });

    alert("Delete request sent");
  }

  if (!recipe || !draft) return <p>Loading...</p>;

  return (
    <div className="container details-page">

      <h2>{recipe.name}</h2>
      <p>By: {recipe.createdBy}</p>

      <h4>Ingredients</h4>
      <textarea
        value={Array.isArray(draft.ingredients) ? draft.ingredients.join(", ") : draft.ingredients}
        onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
        disabled={user?.username !== recipe.createdBy}
      />

      <h4>Steps</h4>
      <textarea
        value={draft.steps}
        onChange={(e) => setDraft({ ...draft, steps: e.target.value })}
        disabled={user?.username !== recipe.createdBy}
      />

      {user?.username === recipe.createdBy && (
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

    </div>
  );
}