export default function RecipeCard({
  recipe,
  likeRecipe,
  rateRecipe
}) {

  return (
    <div className="recipe-card">

      <div className="image-placeholder">
        🍽️
      </div>

      <h3>{recipe.name}</h3>

      <p className="creator">
        By {recipe.createdBy || "Chef"}
      </p>

      <p className="ingredients">
        {recipe.ingredients}
      </p>

      <div className="actions">
        <button
          className="like-btn"
          onClick={() => likeRecipe(recipe._id)}
        >
          ❤️ {recipe.likes || 0}
        </button>

        <button
          className="rate-btn"
          onClick={() => rateRecipe(recipe._id, 5)}
        >
          ⭐ Rate
        </button>
      </div>

    </div>
  );
}
