import { useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";

export default function AddRecipe() {

  const { user } = useContext(AuthContext);

  const [data, setData] = useState({
    name: "",
    ingredients: "",
    steps: ""
  });

  async function handleSubmit(e) {
    e.preventDefault();

    await API.post("/recipes", {
      ...data,
      ingredients: data.ingredients
        .split(",")
        .map(i => i.trim())
        .filter(Boolean),
      createdBy: user.username
    });

    alert("Recipe submitted for approval");
    setData({ name: "", ingredients: "", steps: "" });
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

        <textarea
          placeholder="Ingredients (comma separated)"
          value={data.ingredients}
          onChange={(e) => setData({ ...data, ingredients: e.target.value })}
          required
        />

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