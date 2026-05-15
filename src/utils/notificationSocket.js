import { io } from "socket.io-client";
import { getTokenPayload } from "../constants/localStorage";

const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:3002";

let socket = null;
let listeners = [];
let isConnecting = false;

export const connectNotificationSocket = () => {
    // Prevent duplicate connections (React Strict Mode, re-renders)
    if (socket?.connected || isConnecting) return socket;

    isConnecting = true;

    const payload = getTokenPayload();
    // sub = username, _id = ObjectId — send both so gateway can match either
    const userId = payload?._id || payload?.sub || payload?.userId || payload?.id;
    const username = payload?.sub || payload?.username;

    socket = io(`${WS_URL}/notifications`, {
        query: { userId, username },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
        isConnecting = false;
        console.log("[NotificationSocket] Connected");
    });

    socket.on("disconnect", (reason) => {
        isConnecting = false;
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
