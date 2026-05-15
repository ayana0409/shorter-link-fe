import { io } from "socket.io-client";
import { getTokenWithExpiry, getTokenPayload } from "../constants/localStorage";

const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:3002";

let socket = null;
let listeners = [];

export const connectNotificationSocket = () => {
    if (socket?.connected) return socket;

    const token = getTokenWithExpiry();
    const payload = getTokenPayload();
    const userId = payload?.sub || payload?.userId || payload?.id;

    socket = io(`${WS_URL}/notifications`, {
        query: { userId },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
        console.log("[NotificationSocket] Connected");
    });

    socket.on("disconnect", (reason) => {
        console.log("[NotificationSocket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
        console.warn("[NotificationSocket] Connection error:", err.message);
    });

    // Listen for all notification events and broadcast to registered listeners
    socket.onAny((eventName, data) => {
        if (eventName === "connect" || eventName === "disconnect" || eventName === "connect_error") return;
        listeners.forEach((fn) => fn(eventName, data));
    });

    return socket;
};

export const disconnectNotificationSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    listeners = [];
};

export const onNotification = (callback) => {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter((fn) => fn !== callback);
    };
};

export const isSocketConnected = () => socket?.connected ?? false;
