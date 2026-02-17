import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyRecipes from "./pages/MyRecipes";
import AdminDashboard from "./pages/AdminDashboard";
import AddRecipe from "./pages/AddRecipe";

function App() {
  const { user } = useContext(AuthContext);

  return (

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/myrecipes"
          element={
            <ProtectedRoute user={user}>
              <MyRecipes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN" user={user}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/add" element={<AddRecipe />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
