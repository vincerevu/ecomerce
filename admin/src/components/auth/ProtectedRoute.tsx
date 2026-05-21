import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../ui/spinner/Spinner";

const STAFF_ROLES = ["ADMIN", "MANAGER", "STAFF", "WAREHOUSE_STAFF", "SHIPPER"];

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <Spinner size="xl" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    // Kiểm tra user có role backoffice không — customer không được vào admin
    const userRoles: string[] = Array.isArray(user?.roles) ? user!.roles : [];
    const hasBackofficeRole = userRoles.some((role) =>
        STAFF_ROLES.includes(role) || role !== "USER"
    );

    if (!hasBackofficeRole) {
        // Xóa token/session hiện tại và redirect về signin với thông báo
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
