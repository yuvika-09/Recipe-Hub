import { useState } from "react";
import { AuthContext } from "./AuthContextObject";

function getInitialUser() {
  try {
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error(err);
  }

  return null;
}

export function AuthProvider({ children }) {

  const [user, setUser] = useState(getInitialUser);
  const [loading] = useState(false);

  const login = (data) => {
    localStorage.setItem("token", data.token);

    const userData = data.user || data;

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (nextUser) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}