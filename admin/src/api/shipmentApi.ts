import apiClient from "./apiClient";

export interface ShippingAddressOption {
  code: string;
  name: string;
  parentCode?: string;
}

export interface ShippingServiceOption {
  serviceId?: number;
  shortName?: string;
  serviceTypeId?: string;
}

export interface ShippingFeeResult {
  total: number;
  serviceFee: number;
  insuranceFee: number;
  codFee: number;
}

export interface ShipmentEventRecord {
  id: string;
  providerStatus?: string;
  internalStatus?: string;
  description?: string;
  eventTime?: string;
  rawPayload?: string;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  trackingCode?: string;
  clientOrderCode?: string;
  requiredNote?: string;
  status: string;
  shippingFee?: number;
  expectedDeliveryTime?: string;
  toName: string;
  toPhone: string;
  toAddress: string;
  toProvinceName: string;
  toDistrictName: string;
  toWardName: string;
  events?: ShipmentEventRecord[];
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface EstimateShippingFeePayload {
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
}

export interface CreateShipmentPayload {
  orderId: string;
  fromDistrictId?: number;
  serviceId?: number;
  serviceTypeId?: number;
  paymentTypeId?: number;
  requiredNote?: string;
  codAmount?: number;
  insuranceValue?: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  toName: string;
  toPhone: string;
  toAddress: string;
  toProvinceName: string;
  toDistrictName: string;
  toWardName: string;
  toDistrictId: number;
  toWardCode: string;
  note?: string;
}

export const shipmentApi = {
  getByOrderId: async (orderId: string) => {
    const response = await apiClient.get<ApiResponse<ShipmentRecord>>(
      `/shipments/by-order/${orderId}`,
    );
    return response.data;
  },
  getProvinces: async () => {
    const response = await apiClient.get<ApiResponse<ShippingAddressOption[]>>(
      "/shipments/locations/provinces",
    );
    return response.data;
  },
  getDistricts: async (provinceId: number) => {
    const response = await apiClient.get<ApiResponse<ShippingAddressOption[]>>(
      "/shipments/locations/districts",
      { params: { provinceId } },
    );
    return response.data;
  },
  getWards: async (districtId: number) => {
    const response = await apiClient.get<ApiResponse<ShippingAddressOption[]>>(
      "/shipments/locations/wards",
      { params: { districtId } },
    );
    return response.data;
  },
  getAvailableServices: async (toDistrictId: number, fromDistrictId?: number) => {
    const response = await apiClient.post<ApiResponse<ShippingServiceOption[]>>(
      "/shipments/services",
      {
        toDistrictId,
        fromDistrictId,
      },
    );
    return response.data;
  },
  estimateFee: async (payload: EstimateShippingFeePayload) => {
    const response = await apiClient.post<ApiResponse<ShippingFeeResult>>(
      "/shipments/fee-estimates",
      payload,
    );
    return response.data;
  },
  create: async (payload: CreateShipmentPayload) => {
    const response = await apiClient.post<ApiResponse<ShipmentRecord>>(
      "/shipments",
      payload,
    );
    return response.data;
  },
  sync: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<ShipmentRecord>>(
      `/shipments/${id}/sync`,
    );
    return response.data;
  },
  cancel: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<ShipmentRecord>>(
      `/shipments/${id}/cancel`,
    );
    return response.data;
  },
};
