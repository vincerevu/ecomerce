import apiClient from "./api-client";
import { normalizeCollectionShowcase, CollectionShowcase, CollectionShowcaseResponse } from "@/types/collection";
import { normalizeProduct, Product, ProductResponse } from "@/types/product";

type ApiEnvelope<T> = {
  code: number;
  message: string;
  result: T;
};

type PageResponse<T> = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  last: boolean;
  data: T[];
};

export type CollectionProductListResult = {
  items: Product[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  last: boolean;
};

export const getCollectionShowcases = async ({
  limit = 3,
  productLimit = 15,
}: {
  limit?: number;
  productLimit?: number;
} = {}): Promise<CollectionShowcase[]> => {
  const response = (await apiClient.get("/collections/showcases", {
    params: { limit, productLimit },
  })) as ApiEnvelope<CollectionShowcaseResponse[]>;

  return response.result.map(normalizeCollectionShowcase);
};

export const getCollectionProducts = async ({
  slug,
  page = 0,
  size = 12,
}: {
  slug: string;
  page?: number;
  size?: number;
}): Promise<CollectionProductListResult> => {
  const response = (await apiClient.get(`/collections/${slug}/products`, {
    params: { page, size },
  })) as ApiEnvelope<PageResponse<ProductResponse>>;

  return {
    items: response.result.data.map(normalizeProduct),
    currentPage: response.result.currentPage,
    totalPages: response.result.totalPages,
    pageSize: response.result.pageSize,
    totalElements: response.result.totalElements,
    last: response.result.last,
  };
};
