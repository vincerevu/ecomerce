import apiClient from "./api-client";

type ApiResponse<T> = {
  code: number;
  message: string;
  result: T;
};

export type CheckoutOrderItemPayload = {
  productId?: string;
  productVariantId?: string;
  productName: string;
  productSlug?: string;
  imageUrl?: string;
  colorName?: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
};

export type CheckoutOrderPayload = {
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingDetail?: string;
  shippingProvinceName?: string;
  shippingProvinceCode?: string;
  shippingDistrictName?: string;
  shippingDistrictCode?: string;
  shippingWardName?: string;
  shippingWardCode?: string;
  notes?: string;
  shippingFee: number;
  discountAmount?: number;
  couponCode?: string;
  paymentMethod?: "COD" | "SEPAY";
  paymentStatus: "UNPAID" | "PENDING" | "PARTIALLY_PAID" | "PAID" | "FAILED" | "REFUNDED";
  status: "PENDING" | "CONFIRMED" | "PACKING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  items: CheckoutOrderItemPayload[];
};

export type OrderResponse = {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  paymentStatus: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode?: string;
  couponName?: string;
  totalAmount: number;
};

export type PaymentTransactionResponse = {
  id: string;
  orderId: string;
  transactionCode: string;
  provider: string;
  paymentMethod: string;
  status: string;
  amount: number;
};

export type SepayCheckoutResponse = {
  paymentId: string;
  transactionCode: string;
  providerReference?: string;
  paymentStatus: string;
  orderId: string;
  orderCode: string;
  amount: number;
  bankName?: string;
  bankCode?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  qrCode?: string;
  qrImageUrl?: string;
  checkoutUrl?: string;
  expiredAt?: string;
};

export const checkoutApi = {
  createOrder: async (payload: CheckoutOrderPayload) =>
    (await apiClient.post("/checkout/orders", payload)) as ApiResponse<OrderResponse>,
  createCodPayment: async (orderId: string) =>
    (await apiClient.post(
      `/checkout/payments/cod/${orderId}`
    )) as ApiResponse<PaymentTransactionResponse>,
  createSepayPayment: async (orderId: string) =>
    (await apiClient.post("/checkout/payments/sepay", {
      orderId,
    })) as ApiResponse<SepayCheckoutResponse>,
  syncSepayPayment: async (paymentId: string) =>
    (await apiClient.get(
      `/checkout/payments/sepay/${paymentId}`
    )) as ApiResponse<SepayCheckoutResponse>,
};
