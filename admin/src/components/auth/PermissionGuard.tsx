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

    if (!user) {
        return <>{fallback}</>;
    }

    // Defensive fallback: localStorage cũ có thể thiếu roles/permissions
    const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];
    const userPermissions: string[] = Array.isArray(user.permissions) ? user.permissions : [];

    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

    const hasPermission = requireAll
        ? requiredPermissions.every((p) => userPermissions.includes(p))
        : requiredPermissions.some((p) => userPermissions.includes(p));

    // Admin always has all permissions
    const isAdmin = userRoles.includes("ADMIN");

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
    const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];
    const userPermissions: string[] = Array.isArray(user.permissions) ? user.permissions : [];
    if (userRoles.includes("ADMIN")) return true;

    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

    return requireAll
        ? requiredPermissions.every((item) => userPermissions.includes(item))
        : requiredPermissions.some((item) => userPermissions.includes(item));
};

export default PermissionGuard;
