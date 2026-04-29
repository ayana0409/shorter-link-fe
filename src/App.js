import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import { get } from './utils/request';

function App() {
  const [isConnecting, setIsConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    let timer;
    const attemptPing = async () => {
      try {
        await get('ping');
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
  }, [retryCount]);

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
                  : 'Đang kết nối máy chủ...'}
              </p>
            </>
          )}
        </div>
        <Toaster position='top-right' reverseOrder={false} />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <Toaster position='top-right' reverseOrder={false} />

      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;
