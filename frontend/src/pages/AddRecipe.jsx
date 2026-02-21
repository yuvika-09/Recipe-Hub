import { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";

export default function AddRecipe() {

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [data, setData] = useState({
    name: "",
    ingredients: "",
    steps: "",
    imageUrl: "",
    prepTime: "",
    servings: ""
  });

  const ingredientList = useMemo(() => data.ingredients
    .split(",")
    .map(i => i.trim())
    .filter(Boolean), [data.ingredients]);

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await API.post("/recipes", {
      ...data,
      ingredients: ingredientList,
      prepTime: Number(data.prepTime) || 0,
      servings: Number(data.servings) || 0,
      createdBy: user.username
    });

    navigate("/myrecipes?tab=REQUESTS", {
      state: { newRequest: res.data.request }
    });
  }

  return (
    <div className="container auth-card">
      <h2>Add Recipe</h2>

      <form onSubmit={handleSubmit} className="auth-card">
        <input
          placeholder="Recipe Name"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          required
        />

        <input
          placeholder="Recipe Image URL"
          value={data.imageUrl}
          onChange={(e) => setData({ ...data, imageUrl: e.target.value })}
        />

        <div className="actions">
          <input
            placeholder="Preparation time (mins)"
            type="number"
            value={data.prepTime}
            onChange={(e) => setData({ ...data, prepTime: e.target.value })}
            required
          />

          <input
            placeholder="Servings"
            type="number"
            value={data.servings}
            onChange={(e) => setData({ ...data, servings: e.target.value })}
            required
          />
        </div>

        <textarea
          placeholder="Ingredients (comma separated)"
          value={data.ingredients}
          onChange={(e) => setData({ ...data, ingredients: e.target.value })}
          required
        />

        {ingredientList.length > 0 && (
          <div className="ingredient-preview">
            {ingredientList.map((ing, idx) => (
              <span key={`${ing}-${idx}`}>{ing}</span>
            ))}
          </div>
        )}

        <textarea
          placeholder="Steps"
          value={data.steps}
          onChange={(e) => setData({ ...data, steps: e.target.value })}
          required
        />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}