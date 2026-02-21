import { useEffect, useState, useContext, useRef } from "react";
import io from "socket.io-client";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";

export default function NotificationBell() {

  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const username = user?.username;
  const rootRef = useRef(null);

  useEffect(() => {
    if (!username) return;

    const storageKey = `notifications_${username}`;
    const localData = localStorage.getItem(storageKey);

    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        setTimeout(() => setNotifications(parsed), 0);
      } catch {
        // ignore corrupted local cache
      }
    }

    API.get(`/notifications/${username}`)
      .then(res => {
        setNotifications((prev) => {
          const map = new Map();
          [...prev, ...res.data].forEach((n) => map.set(n._id || `${n.message}-${n.createdAt}`, n));
          return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
      });

    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socket.emit("join", username);

    socket.on("notification", (msg) => {
      if (msg.user === username) {
        setNotifications(prev => [msg, ...prev]);
      }
    });

    return () => socket.disconnect();
  }, [username]);

  useEffect(() => {
    if (!username) return;
    localStorage.setItem(`notifications_${username}`, JSON.stringify(notifications));
  }, [notifications, username]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  if (!username) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  async function markAllRead() {
    await API.put(`/notifications/read-all/${username}`);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markSingleRead(id) {
    await API.put(`/notifications/read/${id}`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  }

  return (
    <div className="notification-bell" ref={rootRef}>
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
              key={n._id || `${n.message}-${n.createdAt}`}
              className={`notif-item ${n.read ? "" : "unread"}`}
              onClick={() => n._id && markSingleRead(n._id)}
            >
              <span>{n.message}</span>
            </button>
          ))}

        </div>
      )}

    </div>
  );
}