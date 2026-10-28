import { useEffect, useState, useCallback, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster, toast } from "react-hot-toast";
import { get } from "./utils/request";
import { initMultiTabSync, cleanupVisibilityRefresh } from "./utils/request";
import {
  selectIsAuthenticated,
  setCredentials,
  updateAccessToken,
  logout as logoutAction,
} from "./store/authSlice";
import { store } from "./store";
import {
  getTokenWithExpiry,
  getRefreshToken,
  setRefreshToken,
  setTokenWithExpiry,
  getIsSso,
  removeToken,
} from "./constants/localStorage";
import {
  parseJwt,
  extractUserFromClaims,
  refreshQuickBiteAccessToken,
} from "./services/authService";
import { getSystemStatus, canMakeNetworkRequests } from "./utils/systemGuard";
import { disconnectNotificationSocket } from "./utils/notificationSocket";
import MaintenanceView from "./components/system/MaintenanceView";
import OutOfHoursView from "./components/system/OutOfHoursView";
import { MSG } from "./constants/messages";

const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";

function App() {
  // System governance state (Maintenance & Operating Hours UTC+7)
  const [systemStatus, setSystemStatus] = useState(() => getSystemStatus());
  const lastWarningToastRef = useRef(0);

  const [isConnecting, setIsConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [serverUnreachable, setServerUnreachable] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Monitor real-time clock & system guard status every second
  useEffect(() => {
    const heartbeatTimer = setInterval(() => {
      const currentStatus = getSystemStatus();
      setSystemStatus(currentStatus);

      // If system is blocked, immediately disconnect any active WebSocket
      if (!currentStatus.canAccess) {
        disconnectNotificationSocket();
        return;
      }

      // If near shutdown, show reminder toast every 30 seconds
      if (currentStatus.isWarning) {
        const now = Date.now();
        if (now - lastWarningToastRef.current >= 30000) {
          lastWarningToastRef.current = now;
          const minutes = currentStatus.minutesLeft;
          const message =
            minutes <= 3
              ? MSG.SYSTEM_GUARD.WARNING_TOAST_URGENT(minutes)
              : MSG.SYSTEM_GUARD.WARNING_TOAST(minutes, currentStatus.shutdown);

          toast(message, {
            id: "shutdown-warning",
            duration: 6000,
            icon: "⏳",
            style: {
              borderRadius: "16px",
              background: "#1e293b",
              color: "#fff",
              fontSize: "14px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
            },
          });
        }
      }
    }, 1000);

    return () => clearInterval(heartbeatTimer);
  }, []);

  // Initialize multi-tab sync on mount
  useEffect(() => {
    initMultiTabSync();
    return () => {
      cleanupVisibilityRefresh();
    };
  }, []);

  // Migrate existing localStorage token to Redux on first load
  useEffect(() => {
    const token = getTokenWithExpiry();
    if (token && !isAuthenticated) {
      try {
        const claims = parseJwt(token);
        const user = extractUserFromClaims(claims);
        const refreshToken = getRefreshToken();
        const isSso = getIsSso();

        store.dispatch(
          setCredentials({
            accessToken: token,
            refreshToken,
            user: user || {
              username: claims.username || claims.preferred_username,
              fullname: claims.fullname || claims.name,
              role: claims.role,
            },
            isSso,
          }),
        );
      } catch {
        // Invalid token, ignore
      }
    }
  }, [isAuthenticated]);

  /**
   * Auto-refresh access token on startup.
   * Called after successful ping to ensure server is awake.
   */
  const attemptRefreshOnStartup = useCallback(async () => {
    if (!canMakeNetworkRequests()) return;

    const currentToken = getTokenWithExpiry();
    if (currentToken) return; // Already have valid token

    const isSso = getIsSso();
    const currentRefreshToken = getRefreshToken();

    // 1. If QuickBite SSO session
    if (isSso && currentRefreshToken) {
      try {
        const {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn,
        } = await refreshQuickBiteAccessToken(currentRefreshToken);

        const claims = parseJwt(newAccessToken);
        const user = extractUserFromClaims(claims);

        store.dispatch(
          setCredentials({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user,
            isSso: true,
          }),
        );

        const safeExpiryMs = Math.max(expiresIn * 1000 - 60000, 5 * 60 * 1000);
        setTokenWithExpiry(newAccessToken, safeExpiryMs);
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken);
        }
        return;
      } catch (err) {
        removeToken();
        store.dispatch(logoutAction());
        return;
      }
    }

    // 2. If Local ShorterLink session
    let username = null;
    try {
      const itemStr = localStorage.getItem("token");
      if (itemStr) {
        const item = JSON.parse(itemStr);
        if (item.value) {
          const claims = parseJwt(item.value);
          if (claims) {
            username =
              claims.username ||
              claims.preferred_username ||
              claims.unique_name;
          }
        }
      }
    } catch {
      // ignore decode errors
    }

    if (!username) return;

    try {
      const response = await axios.post(
        `${apiBaseUrl}/auth/refresh`,
        { username },
        { withCredentials: true },
      );

      const { access_token, expires_in } = response.data;
      store.dispatch(updateAccessToken(access_token));
      const safeExpiryMs = Math.max(
        expires_in * 1000 - 60000,
        5 * 60 * 1000,
      );
      setTokenWithExpiry(access_token, safeExpiryMs);
    } catch {
      try {
        await axios.post(
          `${apiBaseUrl}/auth/logout`,
          {},
          { withCredentials: true },
        );
      } catch {
        // ignore logout API errors
      }
      removeToken();
      store.dispatch(logoutAction());
    }
  }, []);

  // Ping backend only if system guard allows network requests
  useEffect(() => {
    if (!systemStatus.canAccess) {
      setIsConnecting(false);
      return;
    }

    let timer;
    const attemptPing = async () => {
      try {
        await get("ping");
        setIsConnecting(false);
        setServerUnreachable(false);
        // After ping succeeds, try to refresh token
        await attemptRefreshOnStartup();
      } catch (error) {
        if (retryCount < 3) {
          timer = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 10000);
        } else {
          setServerUnreachable(true);
        }
      }
    };

    attemptPing();
    return () => clearTimeout(timer);
  }, [retryCount, attemptRefreshOnStartup, systemStatus.canAccess]);

  // 1. Guard check: System Maintenance Screen
  if (systemStatus.isMaintain) {
    return (
      <>
        <Toaster position="top-right" reverseOrder={false} />
        <MaintenanceView />
      </>
    );
  }

  // 2. Guard check: Outside Operating Hours Screen
  if (systemStatus.isOutOfHours) {
    return (
      <>
        <Toaster position="top-right" reverseOrder={false} />
        <OutOfHoursView
          startup={systemStatus.startup}
          shutdown={systemStatus.shutdown}
          currentTime={systemStatus.formattedCurrentTime}
        />
      </>
    );
  }

  // 3. Fallback: Backend server connecting / wake-up screen
  if (isConnecting || serverUnreachable) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50/50 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200 border border-slate-100 text-center">
          {serverUnreachable ? (
            <>
              <div className="text-4xl mb-2">☕</div>
              <p className="text-lg font-medium text-slate-700">
                Máy chủ đang phản hồi hơi chậm một chút.
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Bạn vui lòng thử lại sau giây lát để tiếp tục nhé!
              </p>
              <button
                onClick={() => {
                  setRetryCount(0);
                  setServerUnreachable(false);
                  setIsConnecting(true);
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-2xl text-sm font-semibold hover:bg-blue-600 transition shadow-md shadow-blue-200"
              >
                Kết nối lại
              </button>
            </>
          ) : (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
              <p className="text-lg font-medium text-slate-600">
                {retryCount > 0
                  ? `Đang kết nối lại... (Lần thử ${retryCount}/3)`
                  : "Đang sẵn sàng khởi động ứng dụng..."}
              </p>
            </>
          )}
        </div>
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    );
  }

  // 4. Standard Application Screen
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Toaster position="top-right" reverseOrder={false} />

      <BrowserRouter>
        <div className="flex flex-grow flex-col">
          <Navbar />
          <div className="flex-grow">
            <AppRoutes />
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
