import { useEffect, useState, useCallback } from "react";
import { BrowserRouter } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
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

const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";

function App() {
  const [isConnecting, setIsConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);

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
    const currentToken = getTokenWithExpiry();
    if (currentToken) return; // Already have valid token

    const isSso = getIsSso();
    const currentRefreshToken = getRefreshToken();

    // 1. If QuickBite SSO session
    if (isSso && currentRefreshToken) {
      try {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn } =
          await refreshQuickBiteAccessToken(currentRefreshToken);

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

        const safeExpiryMs = Math.max((expiresIn * 1000) - 60000, 5 * 60 * 1000);
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
            username = claims.username || claims.preferred_username || claims.unique_name;
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
      const safeExpiryMs = Math.max((expires_in * 1000) - 60000, 5 * 60 * 1000);
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

  useEffect(() => {
    let timer;
    const attemptPing = async () => {
      try {
        await get("ping");
        setIsConnecting(false);
        setMaintenanceMode(false);
        // After ping succeeds, try to refresh token
        await attemptRefreshOnStartup();
      } catch (error) {
        if (retryCount < 3) {
          timer = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 10000);
        } else {
          setMaintenanceMode(true);
        }
      }
    };

    attemptPing();
    return () => clearTimeout(timer);
  }, [retryCount, attemptRefreshOnStartup]);

  if (isConnecting || maintenanceMode) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50/50 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200 border border-slate-100 text-center">
          {maintenanceMode ? (
            <>
              <div className="text-4xl mb-2">⚠️</div>
              <p className="text-lg font-medium text-slate-600">
                Máy chủ hiện đang bảo trì, vui lòng quay lại sau.
              </p>
              <button
                onClick={() => {
                  setRetryCount(0);
                  setMaintenanceMode(false);
                  setIsConnecting(true);
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-2xl text-sm font-semibold hover:bg-blue-600 transition shadow-md shadow-blue-200"
              >
                Thử lại ngay
              </button>
            </>
          ) : (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
              <p className="text-lg font-medium text-slate-600">
                {retryCount > 0
                  ? `Đang kết nối lại... (Lần thử ${retryCount}/3)`
                  : "Đang đánh thức máy chủ..."}
              </p>
            </>
          )}
        </div>
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    );
  }

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
