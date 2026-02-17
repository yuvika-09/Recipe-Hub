import { useEffect, useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function MyRecipes() {

  const { user } = useContext(AuthContext);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    API.get(`/recipes/my/${user.username}`)
      .then(res => setRecipes(res.data));
  }, []);

  return (
    <div>
      <h2>My Recipes</h2>

      {recipes.map(r=>(
        <div key={r._id} style={{border:"1px solid"}}>
          <h3>{r.name}</h3>
          <p>Status: {r.status}</p>

          {r.adminFeedback && (
            <p>Admin Feedback: {r.adminFeedback}</p>
          )}
        </div>
      ))}
    </div>
  );
}
