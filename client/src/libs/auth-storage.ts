"use client";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

type StoredUser = Record<string, unknown> | null;

const isBrowser = () => typeof window !== "undefined";

export const getAccessToken = () => {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getStoredUser = <T = StoredUser>() => {
  if (!isBrowser()) return null as T | null;

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return null as T | null;

  try {
    return JSON.parse(rawUser) as T;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null as T | null;
  }
};

export const setAuthSession = (payload: {
  accessToken: string;
  refreshToken?: string | null;
  user?: unknown;
}) => {
  if (!isBrowser()) return;

  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);

  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (payload.user !== undefined) {
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }
};

export const setStoredUser = (user: unknown) => {
  if (!isBrowser()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  if (!isBrowser()) return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
