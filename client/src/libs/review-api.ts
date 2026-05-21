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

export type ProductReview = {
  id: string;
  userId: string;
  userName?: string;
  orderId: string;
  orderCode?: string;
  productId: string;
  productName?: string;
  rating: number;
  comment?: string;
  approved: boolean;
  createdAt: string;
};

export type ProductReviewSummary = {
  productId: string;
  averageRating: number;
  reviewCount: number;
};

export const reviewApi = {
  getByProduct: async (productId: string, page = 0, size = 6) =>
    (await apiClient.get(`/reviews/products/${productId}`, {
      params: { page, size, sort: "createdAt,desc" },
    })) as ApiResponse<PageResponse<ProductReview>>,
  getSummary: async (productId: string) =>
    (await apiClient.get(`/reviews/products/${productId}/summary`)) as ApiResponse<ProductReviewSummary>,
  getMineByOrder: async (orderId: string) =>
    (await apiClient.get(`/reviews/mine/orders/${orderId}`)) as ApiResponse<ProductReview[]>,
  create: async (payload: {
    orderId: string;
    productId: string;
    rating: number;
    comment?: string;
  }) => (await apiClient.post("/reviews", payload)) as ApiResponse<ProductReview>,
};
