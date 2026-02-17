import { useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function AddRecipe() {

  const { user } = useContext(AuthContext);

  const [data, setData] = useState({
    name: "",
    ingredients: "",
    steps: ""
  });

  async function handleSubmit() {

    await API.post("/recipes", {
      ...data,
      createdBy: user.username
    });

    alert("Recipe submitted for approval");
  }

  return (
    <div>
      <h2>Add Recipe</h2>

      <input
        placeholder="Recipe Name"
        onChange={(e)=>setData({...data,name:e.target.value})}
      />

      <textarea
        placeholder="Ingredients"
        onChange={(e)=>setData({...data,ingredients:e.target.value})}
      />

      <textarea
        placeholder="Steps"
        onChange={(e)=>setData({...data,steps:e.target.value})}
      />

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
