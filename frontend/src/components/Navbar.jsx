import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {

  const { user, logout, loading} = useContext(AuthContext);
  const navigate = useNavigate();

  console.log("NAV USER:", user);


  function handleLogout() {
    logout();
    navigate("/login");
  }

  /* KEEP NAV STRUCTURE EVEN IF NO USER */
  if (!user) return null;

  const role = user?.role || "";
if (loading) return null;

  return (
    <nav className="nav">

      {/* CLICKABLE LOGO */}
      <Link to="/" className="logo" style={{ textDecoration: "none" }}>
        🍳 RecipeHub
      </Link>

      <div className="nav-links">

        {/* USER NAVBAR */}
        {role === "USER" && (
          <>
            <Link to="/">Home</Link>
            <Link to="/add">Add Recipe</Link>
            <Link to="/myrecipes">My Recipes</Link>

            {/* 🔔 ONLY USER */}
            <NotificationBell />
          </>
        )}

        {/* ADMIN NAVBAR */}
        {role === "ADMIN" && (
          <>
            <Link to="/admin/dashboard">Dashboard</Link>
            <Link to="/admin/requests">Requests</Link>
            <Link to="/users">Users</Link>
          </>
        )}

        {/* LOGOUT */}
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
