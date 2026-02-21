import { useEffect, useState, useContext } from "react";
import io from "socket.io-client";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";

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

  async function markAllRead() {
    await API.put(`/notifications/read-all/${username}`);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markSingleRead(id) {
    await API.put(`/notifications/read/${id}`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  }

  return (
    <div className="notification-bell">

      <button
        className="bell-trigger"
        onClick={() => setOpen(!open)}
      >
        🔔 {unreadCount}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <strong>Notifications</strong>
            <button onClick={markAllRead}>Mark all read</button>
          </div>

          {notifications.length === 0 && (
            <p>No notifications</p>
          )}

          {notifications.map(n => (
            <button
              key={n._id}
              className={`notif-item ${n.read ? "" : "unread"}`}
              onClick={() => markSingleRead(n._id)}
            >
              <span>{n.message}</span>
            </button>
          ))}

        </div>
      )}

    </div>
  );
}