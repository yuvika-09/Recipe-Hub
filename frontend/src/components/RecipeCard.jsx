export default function RecipeCard({
  recipe,
  likeRecipe,
  rateRecipe
}) {

  return (
    <div className="card p-3 mb-3 shadow">

      <h4>{recipe.name}</h4>
      <p>{recipe.ingredients}</p>
      <p>By: {recipe.createdBy}</p>

      <button
        className="btn btn-danger me-2"
        onClick={()=>likeRecipe(recipe._id)}
      >
        ❤️ {recipe.likes}
      </button>

      <button
        className="btn btn-warning"
        onClick={()=>rateRecipe(recipe._id,5)}
      >
        ⭐ Rate
      </button>

    </div>
  );
}
