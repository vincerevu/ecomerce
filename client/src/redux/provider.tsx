"use client";

import { store } from "./store";
import { Provider } from "react-redux";
import React, { useEffect } from "react";
import { loadStoredCartItems, saveStoredCartItems } from "@/libs/cart-storage";
import { setCartItems } from "./features/cart-slice";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(setCartItems(loadStoredCartItems()));

    const unsubscribe = store.subscribe(() => {
      saveStoredCartItems(store.getState().cartReducer.items);
    });

    return unsubscribe;
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
