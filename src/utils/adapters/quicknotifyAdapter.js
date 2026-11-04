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
let heartbeatTimer = null;
let isManualDisconnect = false;
let isConnecting = false;

// Event handlers registered for lifecycle events (connect, disconnect)
const eventHandlers = {
  connect: [],
  disconnect: [],
};

/**
 * Start keep-alive heartbeat ping every 25s to keep WebSocket connection
 * alive across reverse proxies (Nginx / Cloudflare) and prevent idle drops.
 */
const startHeartbeat = () => {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        // Send a lightweight ping text payload; QuickNotify ReadPump consumes and discards it
        ws.send(JSON.stringify({ type: "ping" }));
      } catch {
        // Ignore send errors during heartbeat
      }
    }
  }, 25000);
};

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
};

/**
 * Schedule reconnect with delay, ensuring continuous retry on network/token blips
 */
const scheduleReconnect = (delay = 3000) => {
  if (isManualDisconnect) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    connect();
  }, delay);
};

/**
 * Fetch a short-lived QuickNotify authentication token from backend
 */
const fetchQuickNotifyToken = async () => {
  try {
    const res = await get("notifications/qn-token");
    return res?.token || null;
  } catch (err) {
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
      // Retry after 5s if token fetch failed (e.g. backend temporarily uncontactable)
      scheduleReconnect(5000);
      return null;
    }

    // Clean up previous dead connection if any
    if (ws) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      } catch {
        // Ignore close errors on stale socket
      }
      ws = null;
    }

    const wsUrl = `${QN_URL}/ws?token=${encodeURIComponent(qnToken)}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnecting = false;
      startHeartbeat();
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
          // Ignore invalid frames
        }
      }
    };

    ws.onclose = (event) => {
      isConnecting = false;
      stopHeartbeat();
      eventHandlers.disconnect.forEach((fn) => {
        try {
          fn(event);
        } catch (e) {
          console.error("[QuickNotifyAdapter] Disconnect handler error:", e);
        }
      });

      scheduleReconnect(3000);
    };

    ws.onerror = () => {
      isConnecting = false;
      stopHeartbeat();
    };

    return ws;
  } catch (err) {
    isConnecting = false;
    stopHeartbeat();
    scheduleReconnect(5000);
    return null;
  }
};

export const disconnect = () => {
  isManualDisconnect = true;
  isConnecting = false;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  stopHeartbeat();

  if (ws) {
    try {
      ws.close();
    } catch {
      // Ignore close errors
    }
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
