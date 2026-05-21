import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    roles: string[];
    permissions: string[];
    position?: string;
    address?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (accessToken: string, refreshToken: string, user: User) => void;
    updateUser: (userData: Partial<User>) => void;
    refreshUserData: () => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("accessToken");
        if (storedUser && token) {
            try {
                const parsed = JSON.parse(storedUser);
                // Normalize: đảm bảo roles và permissions luôn là array
                setUser({
                    ...parsed,
                    roles: Array.isArray(parsed.roles) ? parsed.roles : [],
                    permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
                });
            } catch {
                // Data localStorage bị corrupt → xóa và yêu cầu login lại
                localStorage.removeItem("user");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
            }
        }
        setIsLoading(false);
    }, []);

    const login = (accessToken: string, refreshToken: string, userData: User) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    const updateUser = (userData: Partial<User>) => {
        setUser((prevUser) => {
            if (!prevUser) return null;
            const updatedUser = { ...prevUser, ...userData };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    const refreshUserData = async () => {
        try {
            const { default: apiClient } = await import("../api/apiClient");
            const response = await apiClient.get("/users/my-info");
            if (response.data.code === 1000) {
                const user = response.data.result;
                updateUser({
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    position: user.position,
                    address: user.address,
                    roles: user.roles.map((r: any) => r.name),
                    permissions: Array.from(new Set(user.roles.flatMap((r: any) => r.permissions?.map((p: any) => p.name) || []))),
                });
            }
        } catch (error) {
            console.error("Failed to refresh user data", error);
        }
    };

    const logout = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (token) {
                const { default: apiClient } = await import("../api/apiClient");
                await apiClient.post("/auth/logout", { token });
            }
        } catch (error) {
            console.error("Failed to call logout API", error);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                updateUser,
                refreshUserData,
                logout,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
