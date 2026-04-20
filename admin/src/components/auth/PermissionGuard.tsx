import React from "react";
import { useAuth } from "../../context/AuthContext";

interface PermissionGuardProps {
    permission: string | string[];
    requireAll?: boolean;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * A component that guards its children based on the user's permissions.
 * 
 * @param permission - A single permission string or an array of permission strings.
 * @param requireAll - If true, the user must have all specified permissions. If false (default), any one will do.
 * @param children - The elements to render if the user has the required permission(s).
 * @param fallback - Optional element to render if the user does NOT have the required permission(s).
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permission,
    requireAll = false,
    children,
    fallback = null,
}) => {
    const { user } = useAuth();

    if (!user || !user.permissions) {
        return <>{fallback}</>;
    }

    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

    const hasPermission = requireAll
        ? requiredPermissions.every((p) => user.permissions.includes(p))
        : requiredPermissions.some((p) => user.permissions.includes(p));

    // Admin always has all permissions
    const isAdmin = user.roles.includes("ADMIN");

    if (isAdmin || hasPermission) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

export const hasAnyPermission = (
    user: { roles: string[]; permissions: string[] } | null,
    permission: string | string[],
    requireAll = false
) => {
    if (!user) return false;
    if (user.roles.includes("ADMIN")) return true;

    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

    return requireAll
        ? requiredPermissions.every((item) => user.permissions.includes(item))
        : requiredPermissions.some((item) => user.permissions.includes(item));
};

export default PermissionGuard;
