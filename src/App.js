import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toaster position="top-right" reverseOrder={false} />

      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;
