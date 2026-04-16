import { Routes, Route, Navigate } from "react-router-dom";
import Navigator from "../pages/Navigator";
import NotFountOrExpire from "../pages/NotFoundOrExpire";
import AccountLocked from "../pages/AccountLocked";
import CreateLink from "../pages/CreateLink";
import { RegisterPage } from "../pages/accounts";
import { LoginPage } from "../pages/auth";
import { AdminPage, AccountManagementPage, AccountDetailPage, AuditLogPage } from "../pages/admin";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/not-found" element={<NotFountOrExpire />} />
      <Route path="/locked" element={<AccountLocked />} />
      <Route path="/home" element={<CreateLink />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/accounts" element={<AccountManagementPage />} />
      <Route path="/admin/audit" element={<AuditLogPage />} />
      <Route path="/admin/:id" element={<AccountDetailPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/s/:shortLink" element={<Navigator />} />
    </Routes>
  );
};

export default AppRoutes;