"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "@/libs/api-client";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAuthSession,
  setStoredUser,
} from "@/libs/auth-storage";
import { userApi } from "@/libs/user-api";
import type { AuthSession, AuthUser } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (nextUser: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUser = useCallback((nextUser: AuthUser) => {
    setStoredUser(nextUser);
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!accessToken && !refreshToken) {
      setUser(null);
      return null;
    }

    const response = await userApi.getMyInfo();
    const nextUser = response.result as AuthUser;
    updateUser(nextUser);
    return nextUser;
  }, [updateUser]);

  useEffect(() => {
    let disposed = false;

    const bootstrap = async () => {
      const storedUser = getStoredUser<AuthUser>();
      if (storedUser && !disposed) {
        setUser(storedUser);
      }

      try {
        await refreshUser();
      } catch {
        if (!disposed) {
          clearAuthSession();
          setUser(null);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      disposed = true;
    };
  }, [refreshUser]);

  const login = useCallback((session: AuthSession) => {
    setAuthSession(session);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await apiClient.post("/auth/logout", { token });
      }
    } catch {
      // best-effort logout; local session is still cleared below.
    } finally {
      clearAuthSession();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
      updateUser,
    }),
    [isLoading, login, logout, refreshUser, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
