import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    async function handleLogin() {

        const res = await axios.post(
            "http://localhost:5001/login",
            { email, password }
        );

        login(res.data);

        if (res.data.role === "ADMIN")
            navigate("/admin");
        else
            navigate("/");
    }

    return (
        <div className="auth-container">

            <div className="auth-card">

                <h2>Login</h2>

                <input
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={handleLogin}>
                    Login
                </button>

            </div>

        </div>
    );

}
