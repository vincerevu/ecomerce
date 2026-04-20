import apiClient from "./api-client";

type ApiResponse<T> = {
  code: number;
  message: string;
  result: T;
};

type PageResponse<T> = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  data: T[];
};

export type CustomerOrderItem = {
  id: string;
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

export type CustomerOrder = {
  id: string;
  orderCode: string;
  userId?: string | null;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingDetail?: string;
  shippingProvinceName?: string;
  shippingDistrictName?: string;
  shippingWardName?: string;
  notes?: string;
  status: "PENDING" | "CONFIRMED" | "PACKING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PENDING" | "PARTIALLY_PAID" | "PAID" | "FAILED" | "REFUNDED";
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  items: CustomerOrderItem[];
};

export const orderApi = {
  getMine: async ({
    userId,
    status,
    page = 0,
    size = 10,
  }: {
    userId: string;
    status?: CustomerOrder["status"];
    page?: number;
    size?: number;
  }) => {
    const filters = [`user.id:'${userId}'`];
    if (status) {
      filters.push(`status:'${status}'`);
    }

    return (await apiClient.get("/orders", {
      params: {
        page,
        size,
        sort: "createdAt,desc",
        filter: filters.join(" and "),
      },
    })) as ApiResponse<PageResponse<CustomerOrder>>;
  },
  getById: async (id: string) =>
    (await apiClient.get(`/orders/${id}`)) as ApiResponse<CustomerOrder>,
  sendCancelOtp: async (id: string) =>
    (await apiClient.post(`/orders/${id}/cancel/send-otp`)) as ApiResponse<void>,
  confirmCancel: async (id: string, otp: string) =>
    (await apiClient.post(`/orders/${id}/cancel/confirm`, { otp })) as ApiResponse<CustomerOrder>,
};
