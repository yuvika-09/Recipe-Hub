import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContextObject";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyRecipes from "./pages/MyRecipes";
import AdminDashboard from "./pages/AdminDashboard";
import AddRecipe from "./pages/AddRecipe";
import RecipeDetails from "./pages/RecipeDetails";
import Profile from "./pages/Profile";
import UserPublicProfile from "./pages/UserPublicProfile";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recipe/:id" element={<RecipeDetails />} />
            <Route path="/users/:username" element={<UserPublicProfile />} />

            <Route
              path="/myrecipes"
              element={
                <ProtectedRoute user={user}>
                  <MyRecipes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute role="USER" user={user}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={<Navigate to="/admin/home" replace />}
            />

            <Route
              path="/admin/home"
              element={
                <ProtectedRoute role="ADMIN" user={user}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/requests"
              element={
                <ProtectedRoute role="ADMIN" user={user}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute role="ADMIN" user={user}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add"
              element={
                <ProtectedRoute role="USER" user={user}>
                  <AddRecipe />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;