import { useNavigate } from "react-router-dom";

export default function RecipeCard({
  recipe,
  likeRecipe,
  rateRecipe
}) {
  const navigate = useNavigate();

  const avgRating = Number(recipe.avgRating || 0).toFixed(1);

  return (
    <div
      className="recipe-card"
      onClick={() => navigate(`/recipe/${recipe._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/recipe/${recipe._id}`)}
    >

      <div className="image-placeholder">
        🍽️
      </div>

      <h3>{recipe.name}</h3>

      <p className="creator">
        By {recipe.createdBy || "Chef"}
      </p>

      <p className="ingredients">
        {Array.isArray(recipe.ingredients)
          ? recipe.ingredients.join(", ")
          : recipe.ingredients}
      </p>

      <p className="meta-row">
        ❤️ {recipe.likes || 0} · ⭐ {avgRating} ({recipe.ratingCount || 0})
      </p>

      <div className="actions">
        <button
          className="like-btn"
          onClick={(e) => {
            e.stopPropagation();
            likeRecipe(recipe._id);
          }}
        >
          ❤️ Like
        </button>

        <button
          className="rate-btn"
          onClick={(e) => {
            e.stopPropagation();
            rateRecipe(recipe._id, 5);
          }}
        >
          ⭐ Rate 5
        </button>
      </div>

    </div>
  );
}