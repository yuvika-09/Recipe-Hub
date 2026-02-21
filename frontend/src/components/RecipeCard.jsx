import { Link, useNavigate } from "react-router-dom";

export default function RecipeCard({
  recipe,
  likeRecipe,
  rateRecipe,
  isLoggedIn,
  currentUsername
}) {
  const navigate = useNavigate();
  const avgRating = Number(recipe.avgRating || 0).toFixed(1);

  const myRating = Array.isArray(recipe.ratings)
    ? recipe.ratings.find((r) => r.username === currentUsername)?.value || 0
    : 0;

  function openRecipe() {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    navigate(`/recipe/${recipe._id}`);
  }

  return (
    <div
      className="recipe-card"
      onClick={openRecipe}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && openRecipe()}
    >
      {recipe.imageUrl ? (
        <img className="recipe-image" src={recipe.imageUrl} alt={recipe.name} />
      ) : (
        <div className="image-placeholder">🍽️</div>
      )}

      <h3>{recipe.name}</h3>

      <p className="creator">
        By{" "}
        <Link
          to={`/users/${recipe.createdBy}`}
          className="author-link"
          onClick={(e) => {
            e.stopPropagation();
            if (!isLoggedIn) {
              e.preventDefault();
              navigate("/login");
            }
          }}
        >
          {recipe.createdBy || "Chef"}
        </Link>
      </p>

      <p className="meta-row">⏱️ {recipe.prepTime || 0} mins · 🍽️ Serves {recipe.servings || 0}</p>
      <p className="meta-row">❤️ {recipe.likes || 0} · ⭐ {avgRating} ({recipe.ratingCount || 0})</p>

      <div className="star-row" onClick={(e) => e.stopPropagation()}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`star-btn ${myRating >= star ? "active" : ""}`}
            onClick={() => rateRecipe(recipe._id, star)}
          >
            ★
          </button>
        ))}
      </div>

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
      </div>

    </div>
  );
}