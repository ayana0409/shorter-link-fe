import { Routes, Route, Navigate } from "react-router-dom";
import { getTokenWithExpiry } from "../constants/localStorage";
import Navigator from "../pages/Navigator";
import NotFountOrExpire from "../pages/NotFoundOrExpire";
import AccountLocked from "../pages/AccountLocked";
import CreateLink from "../pages/CreateLink";
import { RegisterPage } from "../pages/accounts";
import { LoginPage } from "../pages/auth";
import { AdminPage, AccountManagementPage, AccountDetailPage, AuditLogPage, SystemConfigPage } from "../pages/admin";

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = Boolean(getTokenWithExpiry());
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/not-found" element={<NotFountOrExpire />} />
      <Route path="/locked" element={<AccountLocked />} />
      <Route path="/home" element={<ProtectedRoute element={<CreateLink />} />} />
      <Route path="/admin" element={<ProtectedRoute element={<AdminPage />} />} />
      <Route path="/admin/config" element={<ProtectedRoute element={<SystemConfigPage />} />} />
      <Route path="/admin/accounts" element={<ProtectedRoute element={<AccountManagementPage />} />} />
      <Route path="/admin/audit" element={<ProtectedRoute element={<AuditLogPage />} />} />
      <Route path="/admin/:id" element={<ProtectedRoute element={<AccountDetailPage />} />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/s/:shortLink" element={<Navigator />} />
    </Routes>
  );
};

export default AppRoutes;