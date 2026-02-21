import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContextObject";
import NotificationBell from "./NotificationBell";

export default function Navbar() {

  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading || !user) return null;

  const role = user?.role || "";

  return (
    <nav className="nav">
      <Link to="/" className="logo" style={{ textDecoration: "none" }}>
        🍳 RecipeHub
      </Link>

      <div className="nav-links">
        {role === "USER" && (
          <>
            <Link to="/">Home</Link>
            <Link to="/add">Add Recipe</Link>
            <Link to="/myrecipes">My Recipes</Link>
            <Link to="/profile">View Profile</Link>
            <NotificationBell />
          </>
        )}

        {role === "ADMIN" && (
          <>
            <Link to="/admin/home">Home</Link>
            <Link to="/admin/requests">Requests</Link>
            <Link to="/admin/users">Users</Link>
            <NotificationBell />
          </>
        )}

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}