import { Link } from "react-router-dom";

export default function Navbar() {

  return (
    <nav className="nav">

      <h2 className="logo">🍳 RecipeHub</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/add">Add Recipe</Link>
        <Link to="/myrecipes">My Recipes</Link>
        <Link to="/admin">Admin</Link>
      </div>

    </nav>
  );
}
