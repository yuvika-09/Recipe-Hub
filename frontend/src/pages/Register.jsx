import { useState } from "react";
import axios from "axios";

export default function Register() {

  const [data, setData] = useState({});

  async function handleRegister() {
    await axios.post("http://localhost:5001/register", data);
    alert("Registered!");
  }

  return (
    <div>
      <h2>Register</h2>

      <input placeholder="Username"
        onChange={(e)=>setData({...data,username:e.target.value})}
      />

      <input placeholder="Email"
        onChange={(e)=>setData({...data,email:e.target.value})}
      />

      <input placeholder="Password"
        type="password"
        onChange={(e)=>setData({...data,password:e.target.value})}
      />

      <button onClick={handleRegister}>
        Register
      </button>
    </div>
  );
}
