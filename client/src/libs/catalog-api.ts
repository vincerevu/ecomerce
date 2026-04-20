import apiClient from "./api-client";
import {
  normalizeProduct,
  Product,
  ProductResponse,
} from "@/types/product";
import {
  Category,
  CategoryResponse,
  normalizeCategory,
} from "@/types/category";

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

export type ProductListParams = {
  page?: number;
  size?: number;
  sort?: string;
  filter?: string;
  q?: string;
};

export type ProductListResult = {
  items: Product[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  last: boolean;
};

const escapeFilterValue = (value: string) => value.replace(/'/g, "\\'");

const buildKeywordFilter = (keyword: string) => {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    return "";
  }

  const safeKeyword = escapeFilterValue(trimmedKeyword);
  const fields = [
    "name",
    "slug",
    "shortDescription",
    "description",
    "gender",
    "style",
    "category.name",
    "category.slug",
  ];

  return `(${fields.map((field) => `${field}~'${safeKeyword}'`).join(" or ")})`;
};

const mergeFilters = (baseFilter?: string, keyword?: string) => {
  const parts = [baseFilter?.trim(), keyword ? buildKeywordFilter(keyword) : ""].filter(
    (part): part is string => Boolean(part)
  );

  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return parts.map((part) => `(${part})`).join(" and ");
};

export const getProducts = async (
  params: ProductListParams = {}
): Promise<ProductListResult> => {
  const filter = mergeFilters(params.filter, params.q);
  const response = (await apiClient.get("/products", {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 24,
      sort: params.sort ?? "createdAt,desc",
      ...(filter ? { filter } : {}),
    },
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

export const getAllProducts = async ({
  searchTerm,
}: {
  searchTerm?: string;
} = {}): Promise<Product[]> => {
  const firstPage = await getProducts({
    page: 0,
    size: 100,
    sort: "createdAt,desc",
    q: searchTerm?.trim() || undefined,
  });
  return firstPage.items;
};

export const searchProducts = async (
  searchTerm: string,
  size = 6
): Promise<Product[]> => {
  const response = await getProducts({
    page: 0,
    size,
    sort: "createdAt,desc",
    q: searchTerm.trim(),
  });

  return response.items;
};

export const getProductBySlug = async (slug: string): Promise<Product> => {
  const response = (await apiClient.get(
    `/products/slug/${slug}`
  )) as ApiEnvelope<ProductResponse>;

  return normalizeProduct(response.result);
};

export const getCategories = async (): Promise<Category[]> => {
  const response = (await apiClient.get("/categories")) as ApiEnvelope<
    CategoryResponse[]
  >;

  return response.result
    .map(normalizeCategory)
    .sort((left, right) => left.sortOrder - right.sortOrder);
};
