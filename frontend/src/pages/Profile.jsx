import { useContext, useState } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";

export default function Profile() {
  const { user, updateUser, logout } = useContext(AuthContext);

  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    email: user?.email || ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  });

  async function saveProfile() {
    const res = await API.patch(`/auth/users/${user.username}`, profileForm);

    updateUser({
      ...user,
      username: res.data.username,
      email: res.data.email
    });

    alert("Profile updated");
  }

  async function changePassword() {
    await API.patch(`/auth/users/${user.username}/password`, passwordForm);
    setPasswordForm({ currentPassword: "", newPassword: "" });
    alert("Password updated");
  }

  return (
    <div className="container profile-page">
      <h2>View Profile</h2>

      <div className="request-card">
        <h3>Update Account</h3>
        <input
          value={profileForm.username}
          onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
          placeholder="Username"
        />
        <input
          value={profileForm.email}
          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
          placeholder="Email"
        />
        <button className="approve-btn" onClick={saveProfile}>Save Profile</button>
      </div>

      <div className="request-card" style={{ marginTop: "16px" }}>
        <h3>Change Password</h3>
        <input
          type="password"
          value={passwordForm.currentPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          placeholder="Current Password"
        />
        <input
          type="password"
          value={passwordForm.newPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          placeholder="New Password"
        />
        <button className="approve-btn" onClick={changePassword}>Update Password</button>
      </div>

      <button className="logout-btn" style={{ marginTop: "16px" }} onClick={logout}>
        Logout
      </button>
    </div>
  );
}