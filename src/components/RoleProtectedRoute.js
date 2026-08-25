import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getTokenWithExpiry, getTokenRole } from "../constants/localStorage";
import { selectIsAuthenticated, selectUser } from "../store/authSlice";
import { getUserRoles, hasRoleMatch } from "../constants/roles";

const RoleProtectedRoute = ({ element, requiredRole }) => {
    const reduxAuth = useSelector(selectIsAuthenticated);
    const reduxUser = useSelector(selectUser);
    const localAuth = Boolean(getTokenWithExpiry());
    const isAuthenticated = reduxAuth || localAuth;
    const userRole = reduxUser?.role || getTokenRole();
    const allUserRoles = getUserRoles(reduxUser);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!userRole && allUserRoles.length === 0) {
        return <Navigate to="/not-found" replace />;
    }

    if (requiredRole) {
        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const isMatch =
            (userRole && requiredRoles.includes(userRole)) ||
            hasRoleMatch(allUserRoles, requiredRoles);

        if (!isMatch) {
            return <Navigate to="/not-found" replace />;
        }
    }

    return element;
};

export default RoleProtectedRoute;