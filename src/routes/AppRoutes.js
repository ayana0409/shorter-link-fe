import { Routes, Route, Navigate } from "react-router-dom";
import { getTokenWithExpiry } from "../constants/localStorage";
import Navigator from "../pages/Navigator";
import NotFountOrExpire from "../pages/NotFoundOrExpire";
import AccountLocked from "../pages/AccountLocked";
import CreateLink from "../pages/CreateLink";
import GroupsPage from "../pages/group/GroupsPage";
import GroupMembersPage from "../pages/group/GroupMembersPage";
import GroupLinksPage from "../pages/group/GroupLinksPage";
import { RegisterPage } from "../pages/accounts";
import { LoginPage } from "../pages/auth";
import { AdminPage, AccountManagementPage, AccountDetailPage, AuditLogPage, SystemConfigPage, LevelManagementPage } from "../pages/admin";
import RoleProtectedRoute from "../components/RoleProtectedRoute";

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
      <Route path="/groups" element={<ProtectedRoute element={<GroupsPage />} />} />
      <Route path="/groups/:groupId/members" element={<ProtectedRoute element={<GroupMembersPage />} />} />
      <Route path="/groups/:groupId/links" element={<ProtectedRoute element={<GroupLinksPage />} />} />
      <Route path="/admin" element={<RoleProtectedRoute element={<AdminPage />} requiredRole="admin" />} />
      <Route path="/admin/levels" element={<RoleProtectedRoute element={<LevelManagementPage />} requiredRole="admin" />} />
      <Route path="/admin/config" element={<RoleProtectedRoute element={<SystemConfigPage />} requiredRole="admin" />} />
      <Route path="/admin/accounts" element={<RoleProtectedRoute element={<AccountManagementPage />} requiredRole={["admin", "manager"]} />} />
      <Route path="/admin/audit" element={<RoleProtectedRoute element={<AuditLogPage />} requiredRole="admin" />} />
      <Route path="/admin/:id" element={<RoleProtectedRoute element={<AccountDetailPage />} requiredRole="admin" />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/s/:shortLink" element={<Navigator />} />
    </Routes>
  );
};

export default AppRoutes;