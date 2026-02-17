import { Navigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  role,
  user
}) {

  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role)
    return <Navigate to="/" />;

  return children;
}
