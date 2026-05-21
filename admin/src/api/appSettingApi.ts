import apiClient from "./apiClient";

export interface AppSetting {
  key: string;
  value: string;
  description?: string;
  group?: string;
  updatedAt?: string;
}

export interface AppSettingPayload {
  value: string;
  description?: string;
  group?: string;
}

export const appSettingApi = {
  getAll: async () => {
    const response = await apiClient.get<{
      code: number;
      message: string;
      result: AppSetting[];
    }>("/settings");
    return response.data;
  },
  update: async (key: string, payload: AppSettingPayload) => {
    const response = await apiClient.put<{
      code: number;
      message: string;
      result: AppSetting;
    }>(`/settings/${encodeURIComponent(key)}`, payload);
    return response.data;
  },
};
