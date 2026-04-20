"use client";

import type { CartItem } from "@/redux/features/cart-slice";

const CART_STORAGE_KEY = "bagy_cart_items";

const isBrowser = () => typeof window !== "undefined";

export const loadStoredCartItems = (): CartItem[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
};

export const saveStoredCartItems = (items: CartItem[]) => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore local storage quota and parsing errors for cart persistence.
  }
};
