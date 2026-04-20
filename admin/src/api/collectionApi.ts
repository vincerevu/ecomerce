import apiClient from "./apiClient";

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  last: boolean;
  data: T[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface CollectionProductSummary {
  id: string;
  name: string;
  slug: string;
  status?: string;
  imageUrl?: string | null;
}

export interface CollectionRecord {
  id: string;
  name: string;
  slug: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  sourceUrl?: string | null;
  coverMediaUrl?: string | null;
  coverMediaType?: string | null;
  productCount?: number | null;
  linkedProductCount?: number | null;
  sortOrder?: number | null;
  status?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  products?: CollectionProductSummary[] | null;
}

export interface CollectionPayload {
  name: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  sourceUrl?: string;
  coverMediaUrl?: string;
  sortOrder?: number;
  status?: boolean;
  productCount?: number;
  productIds?: string[];
}

export const collectionApi = {
  getAll: async (params?: Record<string, string | number>) => {
    const response = await apiClient.get<ApiResponse<CollectionRecord[]>>("/collections", { params });
    return response.data;
  },
  getPage: async (params?: Record<string, string | number>) => {
    const response = await apiClient.get<ApiResponse<PageResponse<CollectionRecord>>>("/collections/page", { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<CollectionRecord>>(`/collections/${id}`);
    return response.data;
  },
  create: async (data: CollectionPayload) => {
    const response = await apiClient.post<ApiResponse<CollectionRecord>>("/collections", data);
    return response.data;
  },
  update: async (id: string, data: CollectionPayload) => {
    const response = await apiClient.put<ApiResponse<CollectionRecord>>(`/collections/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/collections/${id}`);
    return response.data;
  },
};
