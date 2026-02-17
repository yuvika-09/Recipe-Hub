import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {

  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    API.get("/recipes").then(res => setRecipes(res.data));
  }, []);

  async function approve(id){
    await API.put(`/recipes/approve/${id}`);
  }

  return (
    <div>
      <h2>Admin Panel</h2>

      {recipes.map(r=>(
        <div key={r._id}>
          <h4>{r.name}</h4>
          <button onClick={()=>approve(r._id)}>
            Approve
          </button>
        </div>
      ))}
    </div>
  );
}
