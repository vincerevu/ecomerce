import apiClient from "./apiClient";

export type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type PaymentProvider =
  | "MOMO"
  | "VNPAY"
  | "STRIPE"
  | "ZALOPAY"
  | "MANUAL";

export type PaymentMethod =
  | "BANK_TRANSFER"
  | "CARD"
  | "E_WALLET"
  | "COD";

export type PaymentTransactionType = "CHARGE" | "REFUND";

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  transactionCode: string;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  transactionType: PaymentTransactionType;
  status: PaymentStatus;
  amount: number;
  currency: string;
  providerReference?: string;
  processedAt?: string;
  failureReason?: string;
  notes?: string;
  rawResponse?: string;
  createdAt?: string;
}

export interface CreatePaymentPayload {
  orderId: string;
  transactionCode?: string;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  transactionType: PaymentTransactionType;
  status: PaymentStatus;
  amount: number;
  currency?: string;
  providerReference?: string;
  processedAt?: string;
  failureReason?: string;
  notes?: string;
  rawResponse?: string;
}

export interface UpdatePaymentPayload {
  status: PaymentStatus;
  providerReference?: string;
  processedAt?: string;
  failureReason?: string;
  notes?: string;
  rawResponse?: string;
}

interface PaginatedResult<T> {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  data: T[];
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const paymentApi = {
  getPayments: async (params?: Record<string, string | number>) => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<PaymentRecord>>>(
      "/payments",
      { params },
    );
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<PaymentRecord>>(`/payments/${id}`);
    return response.data;
  },
  create: async (payload: CreatePaymentPayload) => {
    const response = await apiClient.post<ApiResponse<PaymentRecord>>("/payments", payload);
    return response.data;
  },
  update: async (id: string, payload: UpdatePaymentPayload) => {
    const response = await apiClient.patch<ApiResponse<PaymentRecord>>(`/payments/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/payments/${id}`);
    return response.data;
  },
};
