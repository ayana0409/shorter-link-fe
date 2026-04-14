import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;
