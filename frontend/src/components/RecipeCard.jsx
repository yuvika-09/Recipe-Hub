import { Link, useNavigate } from "react-router-dom";
import { displayUsername, isDeletedUser } from "../utils/UserDisplay";

export default function RecipeCard({
  recipe,
  likeRecipe,
  rateRecipe,
  isLoggedIn,
  currentUsername
}) {
  const navigate = useNavigate();
  const avgRating = Number(recipe.avgRating || 0).toFixed(1);
  const deletedAuthor = isDeletedUser(recipe.createdBy);
  const likedBy = Array.isArray(recipe.likedBy) ? recipe.likedBy : [];
  const isLiked = Boolean(currentUsername) && likedBy.includes(currentUsername);

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
        {deletedAuthor ? (
          <span>{displayUsername(recipe.createdBy)}</span>
        ) : (
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
            {displayUsername(recipe.createdBy)}
          </Link>
        )}
      </p>

      <p className="meta-row">⏱️ {recipe.prepTime || 0} mins · 🍽️ Serves {recipe.servings || 0}</p>

      <div className="engagement-row" onClick={(e) => e.stopPropagation()}>
        <div className="like-inline">
          <button
            className={`heart-btn ${isLiked ? "liked" : ""}`}
            aria-label={isLiked ? "Unlike recipe" : "Like recipe"}
            onClick={() => likeRecipe(recipe._id)}
          >
            ♥
          </button>
          <span className="meta-row">{recipe.likes || 0}</span>
        </div>

        <div className="rating-inline">
          <span>⭐ {avgRating}</span>
          <span className="meta-row">({recipe.ratingCount || 0})</span>
        </div>
      </div>

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
    </div>
  );
}