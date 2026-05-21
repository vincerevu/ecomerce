import apiClient from "./api-client";

type ApiResponse<T> = {
  code: number;
  message: string;
  result: T;
};

export type CouponValidationResult = {
  couponId: string;
  code: string;
  name: string;
  discountAmount: number;
  subtotal: number;
  totalAfterDiscount: number;
};

export type CouponRecord = {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount?: number;
  startsAt?: string;
  endsAt?: string;
  active: boolean;
  paymentMethod?: "ALL" | "COD" | "SEPAY";
};

export const couponApi = {
  getPublic: async () =>
    (await apiClient.get("/coupons/public")) as ApiResponse<CouponRecord[]>,
  getAvailable: async (subtotal: number, paymentMethod?: "COD" | "SEPAY") =>
    (await apiClient.get("/coupons/available", {
      params: { subtotal, paymentMethod },
    })) as ApiResponse<CouponValidationResult[]>,
  validate: async (code: string, subtotal: number, paymentMethod?: "COD" | "SEPAY") =>
    (await apiClient.post("/coupons/validate", {
      code,
      subtotal,
      paymentMethod,
    })) as ApiResponse<CouponValidationResult>,
};
