import * as websocketAdapter from "./adapters/websocketAdapter";
import * as quicknotifyAdapter from "./adapters/quicknotifyAdapter";
import { canMakeNetworkRequests } from "./systemGuard";

const NOTIFICATION_PROVIDER = (
  process.env.REACT_APP_NOTIFICATION_PROVIDER || "websocket"
).toLowerCase();

const adapter =
  NOTIFICATION_PROVIDER === "quicknotify"
    ? quicknotifyAdapter
    : websocketAdapter;

// Proxy object providing standard event listener interface (connect, disconnect, etc.)
const socketProxy = {
  on: (event, handler) => adapter.on(event, handler),
  off: (event, handler) => adapter.off(event, handler),
  get connected() {
    return adapter.isConnected();
  },
};

export const connectNotificationSocket = () => {
  // Block connections if system is in maintenance or outside operating hours
  if (!canMakeNetworkRequests()) {
    disconnectNotificationSocket();
    return socketProxy;
  }

  adapter.connect();
  return socketProxy;
};

export const disconnectNotificationSocket = () => {
  adapter.disconnect();
};

export const onNotification = (callback) => {
  return adapter.addListener(callback);
};

export const isSocketConnected = () => adapter.isConnected();
