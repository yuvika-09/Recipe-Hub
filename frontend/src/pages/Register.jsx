import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    username: "",
    email: "",
    password: ""
  });

  async function handleRegister(e) {
    e.preventDefault();

    try {
      await API.post("/auth/register", data);
      alert("Registered successfully. Please login.");
      navigate("/login");
    } catch (err) {
      alert(err?.response?.data || "Failed to register");
    }
  }

  return (
    <div className="auth-container auth-hero">
      <div className="auth-backdrop" aria-hidden="true" />

      <form className="auth-card" onSubmit={handleRegister}>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join Recipe Hub to publish, review, and collaborate on recipes.</p>

        <input
          placeholder="Username"
          value={data.username}
          onChange={(e) => setData({ ...data, username: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
          required
        />

        <button type="submit" className="auth-submit-btn">Register</button>

        <p className="auth-switch-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}