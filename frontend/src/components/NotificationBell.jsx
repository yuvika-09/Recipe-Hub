import { useEffect, useState } from "react";
import io from "socket.io-client";

export default function NotificationBell() {

    const [notifications, setNotifications] = useState([]);

    useEffect(() => {

        const socket = io(import.meta.env.VITE_SOCKET_URL);

        socket.on("notification", (msg) => {
            setNotifications(prev => [msg, ...prev]);
        });

        return () => {
            socket.disconnect();
        };

    }, []);

    return (
        <div className="notification-bell">
            🔔 {notifications.length}
        </div>
    );

}
