import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getTokenWithExpiry, getTokenRole } from "../constants/localStorage";
import { selectIsAuthenticated, selectUser } from "../store/authSlice";

const RoleProtectedRoute = ({ element, requiredRole }) => {
    // Hooks must be called unconditionally (Rules of Hooks)
    const reduxAuth = useSelector(selectIsAuthenticated);
    const reduxUser = useSelector(selectUser);
    const localAuth = Boolean(getTokenWithExpiry());
    const isAuthenticated = reduxAuth || localAuth;
    const userRole = reduxUser?.role || getTokenRole();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!userRole) {
        return <Navigate to="/not-found" replace />;
    }

    if (requiredRole) {
        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!requiredRoles.includes(userRole)) {
            return <Navigate to="/not-found" replace />;
        }
    }

    return element;
};

export default RoleProtectedRoute;