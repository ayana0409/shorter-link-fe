import { Navigate } from "react-router-dom";
import { getTokenWithExpiry, getTokenRole } from "../constants/localStorage";

const RoleProtectedRoute = ({ element, requiredRole }) => {
    const isAuthenticated = Boolean(getTokenWithExpiry());

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const userRole = getTokenRole();

    if (!userRole) {
        return <Navigate to="/not-found" replace />;
    }

    if (requiredRole) {
        // Handle both single role and multiple roles
        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!requiredRoles.includes(userRole)) {
            return <Navigate to="/not-found" replace />;
        }
    }

    return element;
};

export default RoleProtectedRoute;