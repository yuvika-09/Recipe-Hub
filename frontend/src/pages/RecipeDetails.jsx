import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function RecipeDetails(){

  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [recipe,setRecipe] = useState(null);

  useEffect(()=>{
    API.get(`/recipes/${id}`)
      .then(res=>setRecipe(res.data));
  },[id]);

  async function requestUpdate(){

    await API.post("/recipes/requests/update",{
      recipeId: id,
      requestedBy: user.username,
      data: recipe
    });

    alert("Update request sent");
  }

  async function requestDelete(){

    await API.post("/recipes/requests/delete",{
      recipeId: id,
      requestedBy: user.username
    });

    alert("Delete request sent");
  }

  if(!recipe) return <p>Loading...</p>;

  return (
    <div className="container">

      <h2>{recipe.name}</h2>

      <p>By: {recipe.createdBy}</p>

      <h4>Ingredients</h4>
      <p>{recipe.ingredients}</p>

      <h4>Steps</h4>
      <p>{recipe.steps}</p>

      {user?.username === recipe.createdBy && (
        <div style={{marginTop:"20px"}}>

          <button onClick={requestUpdate}>
            Request Update
          </button>

          <button
            style={{marginLeft:"10px"}}
            onClick={requestDelete}
          >
            Request Delete
          </button>

        </div>
      )}

    </div>
  );
}
