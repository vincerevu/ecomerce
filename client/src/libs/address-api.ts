import apiClient from "./api-client";

type ApiResponse<T> = {
  code: number;
  message: string;
  result: T;
};

export type AddressRecord = {
  id: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  defaultAddress: boolean;
};

export type AddressPayload = {
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  defaultAddress?: boolean;
};

export const addressApi = {
  getMine: async () => {
    return (await apiClient.get("/addresses")) as ApiResponse<AddressRecord[]>;
  },
  create: async (payload: AddressPayload) => {
    return (await apiClient.post("/addresses", payload)) as ApiResponse<AddressRecord>;
  },
  update: async (addressId: string, payload: AddressPayload) => {
    return (await apiClient.put(`/addresses/${addressId}`, payload)) as ApiResponse<AddressRecord>;
  },
  delete: async (addressId: string) => {
    return (await apiClient.delete(`/addresses/${addressId}`)) as ApiResponse<void>;
  },
};
