import apiClient from "./api-client";

type ApiResponse<T> = {
  code: number;
  message: string;
  result: T;
};

export type ShippingAddressOption = {
  code: string;
  name: string;
  parentCode?: string;
};

export type ShippingServiceOption = {
  serviceId?: number;
  shortName?: string;
  serviceTypeId?: string;
};

export type ShippingFeeResult = {
  total: number;
  serviceFee: number;
  insuranceFee: number;
  codFee: number;
};

export type ShipmentEvent = {
  id: string;
  providerStatus?: string;
  internalStatus?: string;
  description?: string;
  eventTime?: string;
};

export type ShipmentDetail = {
  id: string;
  orderId: string;
  orderCode?: string;
  provider?: string;
  trackingCode?: string;
  status?: string;
  shippingFee?: number;
  expectedDeliveryTime?: string;
  createdAt?: string;
  toName?: string;
  toPhone?: string;
  toAddress?: string;
  toProvinceName?: string;
  toDistrictName?: string;
  toWardName?: string;
  events?: ShipmentEvent[];
};

export type EstimateShippingFeePayload = {
  fromDistrictId?: number;
  toDistrictId: number;
  toWardCode: string;
  serviceId?: number;
  serviceTypeId?: number;
  insuranceValue?: number;
  codAmount?: number;
  weight: number;
  length: number;
  width: number;
  height: number;
};

export const shippingApi = {
  getProvinces: async () =>
    (await apiClient.get("/shipments/locations/provinces")) as ApiResponse<
      ShippingAddressOption[]
    >,
  getDistricts: async (provinceId: number) =>
    (await apiClient.get("/shipments/locations/districts", {
      params: { provinceId },
    })) as ApiResponse<ShippingAddressOption[]>,
  getWards: async (districtId: number) =>
    (await apiClient.get("/shipments/locations/wards", {
      params: { districtId },
    })) as ApiResponse<ShippingAddressOption[]>,
  getServices: async (toDistrictId: number, fromDistrictId?: number) =>
    (await apiClient.post("/shipments/services", {
      toDistrictId,
      fromDistrictId,
    })) as ApiResponse<ShippingServiceOption[]>,
  estimateFee: async (payload: EstimateShippingFeePayload) =>
    (await apiClient.post("/shipments/fee-estimates", payload)) as ApiResponse<ShippingFeeResult>,
  getByOrderId: async (orderId: string) =>
    (await apiClient.get(`/shipments/by-order/${orderId}`)) as ApiResponse<ShipmentDetail>,
};
