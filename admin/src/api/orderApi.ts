import apiClient from "./apiClient";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "REFUNDED"
  | "FAILED";

export interface OrderItemRecord {
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
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
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
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  itemCount: number;
  createdAt?: string;
  items: OrderItemRecord[];
}

export interface CreateOrderItemPayload {
  productId?: string;
  productVariantId?: string;
  productName?: string;
  productSlug?: string;
  imageUrl?: string;
  colorName?: string;
  sizeName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateOrderPayload {
  orderCode?: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  shippingDetail?: string;
  shippingProvinceName?: string;
  shippingProvinceCode?: string;
  shippingDistrictName?: string;
  shippingDistrictCode?: string;
  shippingWardName?: string;
  shippingWardCode?: string;
  notes?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingFee?: number;
  discountAmount?: number;
  items: CreateOrderItemPayload[];
}

export interface UpdateOrderReceiverPayload {
  customerName: string;
  customerPhone: string;
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

export const orderApi = {
  getOrders: async (params?: Record<string, string | number>) => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<OrderRecord>>>(
      "/orders",
      { params },
    );
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<OrderRecord>>(`/orders/${id}`);
    return response.data;
  },
  create: async (data: CreateOrderPayload) => {
    const response = await apiClient.post<ApiResponse<OrderRecord>>("/orders", data);
    return response.data;
  },
  updateStatus: async (
    id: string,
    data: { status?: OrderStatus; paymentStatus?: PaymentStatus },
  ) => {
    const response = await apiClient.patch<ApiResponse<OrderRecord>>(
      `/orders/${id}/status`,
      data,
    );
    return response.data;
  },
  updateReceiver: async (id: string, data: UpdateOrderReceiverPayload) => {
    const response = await apiClient.patch<ApiResponse<OrderRecord>>(
      `/orders/${id}/receiver`,
      data,
    );
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/orders/${id}`);
    return response.data;
  },
};
