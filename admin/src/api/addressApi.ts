import apiClient from "./apiClient";

export interface AddressRecord {
  id: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  defaultAddress: boolean;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const addressApi = {
  getByUserId: async (userId: string) => {
    const response = await apiClient.get<ApiResponse<AddressRecord[]>>(
      `/addresses/admin/users/${userId}`,
    );
    return response.data;
  },
};
