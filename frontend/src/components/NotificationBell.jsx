import { useEffect, useState, useContext } from "react";
import io from "socket.io-client";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function NotificationBell() {

  const { user } =
    useContext(AuthContext);

  const [notifications, setNotifications] =
    useState([]);

  const [open, setOpen] = useState(false);

  const username = user?.username;

  useEffect(() => {

    if (!username) return;

    API.get(`/notifications/${username}`)
      .then(res => setNotifications(res.data));

    const socket =
      io(import.meta.env.VITE_SOCKET_URL);

    socket.emit("join", username);

    socket.on("notification", (msg) => {
      if (msg.user === username) {
        setNotifications(prev => [msg, ...prev]);
      }
    });

    return () => socket.disconnect();

  }, [username]);

  if (!username) return null;

  const unreadCount =
    notifications.filter(n => !n.read).length;

  return (
    <div className="notification-bell">

      <div
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer" }}
      >
        🔔 {unreadCount}
      </div>

      {open && (
        <div className="notif-dropdown">

          {notifications.length === 0 && (
            <p>No notifications</p>
          )}

          {notifications.map(n => (
            <p key={n._id}>
              {n.message}
            </p>
          ))}

        </div>
      )}

    </div>
  );
}
