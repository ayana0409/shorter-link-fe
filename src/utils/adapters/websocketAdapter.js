import { io } from "socket.io-client";
import { getTokenPayload } from "../../constants/localStorage";

const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:3002";

let socket = null;
let listeners = [];
let isConnecting = false;

// Event handlers registered before socket connection
const eventHandlers = {
  connect: [],
  disconnect: [],
};

export const connect = () => {
  if (socket?.connected || isConnecting) {
    return socket;
  }

  isConnecting = true;

  const payload = getTokenPayload();
  const userId =
    payload?._id || payload?.sub || payload?.userId || payload?.id;
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
    console.log("[WebSocketAdapter] Connected");
    eventHandlers.connect.forEach((fn) => fn());
  });

  socket.on("disconnect", (reason) => {
    isConnecting = false;
    console.log("[WebSocketAdapter] Disconnected:", reason);
    eventHandlers.disconnect.forEach((fn) => fn(reason));
  });

  socket.on("connect_error", (err) => {
    console.warn("[WebSocketAdapter] Connection error:", err.message);
  });

  // Relay any incoming notifications to registered listeners
  socket.onAny((eventName, data) => {
    if (
      eventName === "connect" ||
      eventName === "disconnect" ||
      eventName === "connect_error"
    ) {
      return;
    }
    listeners.forEach((fn) => fn(eventName, data));
  });

  return socket;
};

export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  listeners = [];
  isConnecting = false;
};

export const addListener = (callback) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((fn) => fn !== callback);
  };
};

export const isConnected = () => socket?.connected ?? false;

export const on = (event, handler) => {
  if (socket) {
    socket.on(event, handler);
  }
  if (eventHandlers[event] && !eventHandlers[event].includes(handler)) {
    eventHandlers[event].push(handler);
  }
};

export const off = (event, handler) => {
  if (socket) {
    socket.off(event, handler);
  }
  if (eventHandlers[event]) {
    eventHandlers[event] = eventHandlers[event].filter((fn) => fn !== handler);
  }
};

export const getSocket = () => socket;

