import apiClient from "./apiClient";

export type DiscountType = "PERCENT" | "FIXED";
export type CouponScope = "ALL" | "MEMBERSHIP_TIER" | "CUSTOMER";
export type CouponPaymentMethod = "ALL" | "COD" | "SEPAY";

export interface CouponRecord {
  id: string;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  startsAt?: string;
  endsAt?: string;
  active: boolean;
  scope?: CouponScope;
  paymentMethod?: CouponPaymentMethod;
  targetMembershipTierId?: string;
  targetMembershipTierName?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserPhone?: string;
  createdAt?: string;
}

export type CouponPayload = Omit<
  CouponRecord,
  "id" | "usedCount" | "createdAt" | "targetMembershipTierName" | "targetUserName" | "targetUserPhone"
>;

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

interface PaginatedResult<T> {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  data: T[];
}

export const couponApi = {
  getCoupons: async (params?: Record<string, string | number>) => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<CouponRecord>>>("/coupons", { params });
    return response.data;
  },
  create: async (payload: CouponPayload) => {
    const response = await apiClient.post<ApiResponse<CouponRecord>>("/coupons", payload);
    return response.data;
  },
  update: async (id: string, payload: CouponPayload) => {
    const response = await apiClient.put<ApiResponse<CouponRecord>>(`/coupons/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/coupons/${id}`);
    return response.data;
  },
};
