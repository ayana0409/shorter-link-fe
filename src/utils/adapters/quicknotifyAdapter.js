import { get } from "../request";

const rawQnUrl =
  process.env.REACT_APP_QUICKNOTIFY_URL || "ws://localhost:8080";

// Ensure URL starts with ws:// or wss:// and matches current page protocol (HTTPS -> WSS)
const formatWsUrl = (url) => {
  let formatted = url;
  if (formatted.startsWith("http://")) formatted = formatted.replace("http://", "ws://");
  if (formatted.startsWith("https://")) formatted = formatted.replace("https://", "wss://");

  // If current page is loaded over HTTPS, automatically upgrade ws:// to wss:// to prevent browser Mixed Content block
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    formatted.startsWith("ws://")
  ) {
    formatted = formatted.replace("ws://", "wss://");
  }

  return formatted;
};

const QN_URL = formatWsUrl(rawQnUrl);

let ws = null;
let listeners = [];
let reconnectTimer = null;
let isManualDisconnect = false;
let isConnecting = false;

// Event handlers registered for lifecycle events (connect, disconnect)
const eventHandlers = {
  connect: [],
  disconnect: [],
};

/**
 * Fetch a short-lived QuickNotify authentication token from backend
 */
const fetchQuickNotifyToken = async () => {
  try {
    const res = await get("notifications/qn-token");
    return res?.token || null;
  } catch (err) {
    console.warn("[QuickNotifyAdapter] Failed to fetch QN token:", err.message);
    return null;
  }
};

export const connect = async () => {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return ws;
  }

  if (isConnecting) return null;
  isConnecting = true;
  isManualDisconnect = false;

  try {
    const qnToken = await fetchQuickNotifyToken();
    if (!qnToken) {
      isConnecting = false;
      return null;
    }

    const wsUrl = `${QN_URL}/ws?token=${encodeURIComponent(qnToken)}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnecting = false;
      eventHandlers.connect.forEach((fn) => {
        try {
          fn();
        } catch (e) {
          console.error("[QuickNotifyAdapter] Connect handler error:", e);
        }
      });
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;

      // QuickNotify may send multiple newline-separated messages in a single frame
      const lines = event.data.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const notification = JSON.parse(trimmed);

          const contentData = notification.content?.data || {};
          const eventName =
            contentData.event || notification.scope || "new_notification";

          // Normalize notification payload to pass to subscribers
          const data = {
            id:
              notification.event_id ||
              `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            event_id: notification.event_id,
            scope: notification.scope,
            project_id: notification.project_id,
            message:
              contentData.message ||
              (typeof contentData === "string"
                ? contentData
                : ""),
            ...contentData,
          };

          listeners.forEach((fn) => {
            try {
              fn(eventName, data, notification);
            } catch (cbErr) {
              console.error("[QuickNotifyAdapter] Listener callback error:", cbErr);
            }
          });
        } catch (parseErr) {
          console.warn(
            "[QuickNotifyAdapter] Failed to parse message line:",
            trimmed,
            parseErr,
          );
        }
      }
    };

    ws.onclose = (event) => {
      isConnecting = false;
      eventHandlers.disconnect.forEach((fn) => {
        try {
          fn(event);
        } catch (e) {
          console.error("[QuickNotifyAdapter] Disconnect handler error:", e);
        }
      });

      if (!isManualDisconnect) {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      isConnecting = false;
    };

    return ws;
  } catch (err) {
    isConnecting = false;
    return null;
  }
};

export const disconnect = () => {
  isManualDisconnect = true;
  isConnecting = false;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;

  if (ws) {
    ws.close();
    ws = null;
  }
  listeners = [];
};

export const addListener = (callback) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((fn) => fn !== callback);
  };
};

export const isConnected = () => ws?.readyState === WebSocket.OPEN;

export const on = (event, handler) => {
  if (eventHandlers[event] && !eventHandlers[event].includes(handler)) {
    eventHandlers[event].push(handler);
  }
  // If already connected when handler is attached, immediately trigger connect
  if (event === "connect" && isConnected()) {
    try {
      handler();
    } catch (e) {
      console.error("[QuickNotifyAdapter] Connect handler trigger error:", e);
    }
  }
};

export const off = (event, handler) => {
  if (eventHandlers[event]) {
    eventHandlers[event] = eventHandlers[event].filter((fn) => fn !== handler);
  }
};

export const getSocket = () => ws;
