import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

export const PAGE_SIZE_OPTIONS = [5, 8, 10, 20, 50];
const DEFAULT_PAGE_SIZE_SETTING_KEY = "admin.pagination.default_page_size";

export function useStoredPageSize(storageKey: string, defaultValue = 10) {
  const hasStoredValue = () =>
    typeof window !== "undefined" && window.localStorage.getItem(storageKey) !== null;

  const [pageSize, setPageSizeState] = useState(() => {
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
        const response = await apiClient.get<{
          code: number;
          message: string;
          result: string;
        }>(`/settings/${DEFAULT_PAGE_SIZE_SETTING_KEY}`, {
          params: { defaultValue: String(defaultValue) },
        });
        const parsedValue = Number(response.data.result);
        if (isMounted && PAGE_SIZE_OPTIONS.includes(parsedValue)) {
          setPageSizeState(parsedValue);
        }
      } catch (error) {
        console.error("Failed to load default admin page size", error);
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
    setPageSizeState(nextPageSize);
  };

  return [pageSize, setStoredPageSize] as const;
}
