import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../ui/spinner/Spinner";

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

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

    return <Outlet />;
};

export default ProtectedRoute;
