import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";



export default function Navbar() {
    const [pendingCount, setPendingCount] = useState(0);

    const { user } = useContext(AuthContext);

    useEffect(() => {

        if (user?.role !== "ADMIN") return;

        API.get("/recipes/requests/PENDING")
            .then(res => setPendingCount(res.data.length))
            .catch(console.error);

    }, [user]);




    return (
        <nav className="nav">

            <h2 className="logo">🍳 RecipeHub</h2>

            <div className="nav-links">

                <Link to="/">Home</Link>

                {/* USER LINKS */}
                {user?.role === "USER" && (
                    <>
                        <Link to="/add">Add Recipe</Link>
                        <Link to="/myrecipes">My Recipes</Link>
                    </>
                )}

                {/* ADMIN LINKS */}
                {user?.role === "ADMIN" && (
                    <Link to="/admin">
                        Requests
                        {pendingCount > 0 && (
                            <span className="badge">{pendingCount}</span>
                        )}
                    </Link>
                )}

            </div>


        </nav>
    );
}
