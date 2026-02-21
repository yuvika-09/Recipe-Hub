import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import RecipeCard from "../components/RecipeCard";
import { AuthContext } from "../context/AuthContextObject";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [recipesData, setRecipes] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const loadMore = useCallback(async () => {
    try {
      const nextPage = page + 1;
      const res = await API.get(`/recipes?page=${nextPage}`);
      if (res && Array.isArray(res.data) && res.data.length) {
        setRecipes(prev => [...prev, ...res.data]);
        setFiltered(prev => [...prev, ...res.data]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more recipes:", err);
    }
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1
        >= document.documentElement.scrollHeight
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  useEffect(() => {
    API.get("/recipes").then(res => {
      setRecipes(res.data);
      setFiltered(res.data);
    });
  }, []);

  function searchRecipes(e) {
    const query = e.target.value.toLowerCase();

    const result = recipesData.filter(r => {
      const name = r.name ? String(r.name).toLowerCase() : "";

      let ingredients = "";
      if (Array.isArray(r.ingredients)) {
        ingredients = r.ingredients.join(" ").toLowerCase();
      } else if (typeof r.ingredients === "string") {
        ingredients = r.ingredients.toLowerCase();
      }

      return name.includes(query) || ingredients.includes(query);
    });

    setFiltered(result);
  }

  async function likeRecipe(id) {
    if (!user) {
      navigate("/login");
      return;
    }

    const res = await API.put(`/recipes/like/${id}`, {
      username: user.username
    });

    setFiltered(prev =>
      prev.map(r =>
        r._id === id
          ? {
            ...r,
            likes: res.data.likes,
            avgRating: res.data.avgRating,
            ratingCount: res.data.ratingCount
          }
          : r
      )
    );
  }

  async function rateRecipe(id, rating) {
    if (!user) {
      navigate("/login");
      return;
    }

    const res = await API.put(`/recipes/rate/${id}`, {
      username: user.username,
      rating
    });

    setFiltered(prev =>
      prev.map(r =>
        r._id === id
          ? {
            ...r,
            avgRating: res.data.avgRating,
            ratingCount: res.data.ratingCount,
            ratings: res.data.ratings
          }
          : r
      )
    );
  }

  return (
    <div className="container">
      <input
        placeholder="🔎 Search delicious recipes..."
        onChange={searchRecipes}
        className="search"
      />

      {filtered.length === 0 && (
        <p>No recipes yet 🍳</p>
      )}

      <div className="recipe-grid">
        {filtered.map(r => (
          <RecipeCard
            key={r._id}
            recipe={r}
            likeRecipe={likeRecipe}
            rateRecipe={rateRecipe}
            isLoggedIn={Boolean(user)}
            currentUsername={user?.username}
          />
        ))}
      </div>

    </div>
  );
}