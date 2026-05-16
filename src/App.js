import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import { get } from './utils/request';
import {
  getTokenWithExpiry,
  getRefreshToken,
  setTokenWithExpiry,
  setRefreshToken,
  removeToken,
} from './constants/localStorage';

const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [isConnecting, setIsConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  /**
   * Attempt to refresh the token using a direct axios call (bypassing
   * the request interceptor which depends on the token being valid).
   * This is called AFTER a successful ping to ensure the server is awake.
   */
  const attemptRefreshAfterPing = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    // We need the username from the expired token payload
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      const item = JSON.parse(token);
      const base64Url = item.value.split('.')[1];
      if (!base64Url) return false;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const payload = JSON.parse(atob(padded));
      if (!payload.username) return false;

      const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: refreshToken,
          username: payload.username,
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      setTokenWithExpiry(data.access_token, data.expires_in * 1000);
      setRefreshToken(data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let timer;
    const attemptPing = async () => {
      try {
        await get('ping');

        // Ping succeeded — check if we need to refresh an expired token
        const currentToken = getTokenWithExpiry();
        if (!currentToken && getRefreshToken()) {
          // Token expired but we have a refresh token — try to refresh
          const refreshed = await attemptRefreshAfterPing();
          if (!refreshed) {
            // Refresh failed — clear tokens, user needs to log in
            removeToken();
          }
        }

        setIsConnecting(false);
        setMaintenanceMode(false);
      } catch (error) {
        if (retryCount < 3) {
          timer = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 10000);
        } else {
          setMaintenanceMode(true);
        }
      }
    };

    attemptPing();
    return () => clearTimeout(timer);
  }, [retryCount, attemptRefreshAfterPing]);

  if (isConnecting || maintenanceMode) {
    return (
      <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50/50 backdrop-blur-md'>
        <div className='flex flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200 border border-slate-100 text-center'>
          {maintenanceMode ? (
            <>
              <div className='text-4xl mb-2'>⚠️</div>
              <p className='text-lg font-medium text-slate-600'>Máy chủ hiện đang bảo trì, vui lòng quay lại sau.</p>
              <button
                onClick={() => {
                  setRetryCount(0);
                  setMaintenanceMode(false);
                  setIsConnecting(true);
                }}
                className='px-6 py-2 bg-blue-500 text-white rounded-2xl text-sm font-semibold hover:bg-blue-600 transition shadow-md shadow-blue-200'
              >
                Thử lại ngay
              </button>
            </>
          ) : (
            <>
              <div className='h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500'></div>
              <p className='text-lg font-medium text-slate-600'>
                {retryCount > 0
                  ? `Đang kết nối lại... (Lần thử ${retryCount}/3)`
                  : 'Đang đánh thức máy chủ...'}
              </p>
            </>
          )}
        </div>
        <Toaster position='top-right' reverseOrder={false} />
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col bg-slate-50 text-slate-900'>
      <Toaster position='top-right' reverseOrder={false} />

      <BrowserRouter>
        <div className='flex flex-grow flex-col'>
          <Navbar />
          <div className='flex-grow'>
            <AppRoutes />
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;

