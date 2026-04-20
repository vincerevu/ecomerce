import apiClient from "./api-client";

type ApiResponse<T> = {
  code: number;
  message: string;
  result: T;
};

export type PointHistoryRecord = {
  id: string;
  points: number;
  reason?: string | null;
  orderId?: string | null;
  createdDate: string;
};

export const pointsApi = {
  getHistory: async () =>
    (await apiClient.get("/points/history")) as ApiResponse<PointHistoryRecord[]>,
};
