import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {

  const [recipes, setRecipes] = useState([]);

  // LOAD PENDING RECIPES
  useEffect(() => {
    API.get("/recipes/pending")
      .then(res => setRecipes(res.data));
  }, []);

  // APPROVE RECIPE
  async function approve(id) {

    await API.put(`/recipes/approve/${id}`);

    // ⭐ remove approved recipe instantly from UI
    setRecipes(prev =>
      prev.filter(r => r._id !== id)
    );
  }

  return (
    <div>
      <h2>Admin Panel</h2>

      {recipes.length === 0 && (
        <p>No pending recipes</p>
      )}

      {recipes.map(r => (
        <div
          key={r._id}
          style={{
            border: "1px solid gray",
            margin: "10px",
            padding: "10px"
          }}
        >
          <h4>{r.name}</h4>
          <p>{r.ingredients}</p>

          <button onClick={() => approve(r._id)}>
            Approve
          </button>
        </div>
      ))}
    </div>
  );
}
