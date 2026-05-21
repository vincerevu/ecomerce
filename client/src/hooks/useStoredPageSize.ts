"use client";

import { useEffect, useState } from "react";
import apiClient from "@/libs/api-client";

export const PAGE_SIZE_OPTIONS = [8, 12, 20, 40, 60];
const DEFAULT_PAGE_SIZE_SETTING_KEY = "client.pagination.default_page_size";

export function useStoredPageSize(storageKey: string, defaultValue = 12) {
  const hasStoredValue = () =>
    typeof window !== "undefined" && window.localStorage.getItem(storageKey) !== null;

  const [pageSize, setPageSize] = useState(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    const storedValue = window.localStorage.getItem(storageKey);
    const parsedValue = storedValue ? Number(storedValue) : defaultValue;
    return PAGE_SIZE_OPTIONS.includes(parsedValue) ? parsedValue : defaultValue;
  });
  const [hasUserOverride, setHasUserOverride] = useState(hasStoredValue);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (hasStoredValue()) {
      setHasUserOverride(true);
      return;
    }

    let isMounted = true;

    const loadDefaultPageSize = async () => {
      try {
        const response = await apiClient.get<any, {
          code: number;
          message: string;
          result: string;
        }>(`/settings/${DEFAULT_PAGE_SIZE_SETTING_KEY}`, {
          params: { defaultValue: String(defaultValue) },
        });
        const parsedValue = Number(response.result);
        if (isMounted && PAGE_SIZE_OPTIONS.includes(parsedValue)) {
          setPageSize(parsedValue);
        }
      } catch (error) {
        console.error("Failed to load default client page size", error);
      } finally {
        // Defaults from app settings should not become a personal override.
      }
    };

    void loadDefaultPageSize();

    return () => {
      isMounted = false;
    };
  }, [defaultValue, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasUserOverride) {
      return;
    }

    window.localStorage.setItem(storageKey, String(pageSize));
  }, [hasUserOverride, pageSize, storageKey]);

  const setStoredPageSize = (nextPageSize: number) => {
    setHasUserOverride(true);
    setPageSize(nextPageSize);
  };

  return [pageSize, setStoredPageSize] as const;
}
