import apiClient from "./apiClient";

export interface ProductReviewRecord {
  id: string;
  userName?: string;
  orderCode?: string;
  productName?: string;
  rating: number;
  comment?: string;
  approved: boolean;
  createdAt?: string;
}

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

export const reviewApi = {
  getReviews: async (params?: Record<string, string | number>) => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<ProductReviewRecord>>>("/reviews", { params });
    return response.data;
  },
  update: async (id: string, payload: { rating: number; comment?: string; approved?: boolean }) => {
    const response = await apiClient.put<ApiResponse<ProductReviewRecord>>(`/reviews/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/reviews/${id}`);
    return response.data;
  },
};
