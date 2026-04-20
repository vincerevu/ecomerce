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

export interface ProductVariant {
    id?: string;
    sizeName: string;
    originalPrice: number;
    salePrice: number;
    stockQuantity: number;
}

export interface ProductColor {
    id?: string;
    colorName: string;
    hexCode: string;
    mainImageIndex?: number;
    imageUrls?: string[];
    imageUrl?: string; // used for preview
    variants: ProductVariant[];
}

export interface ProductPayload {
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    material?: string;
    gender?: string;
    style?: string;
    categoryId: string;
    tagIds: string[];
    colors: ProductColor[];
    status?: string;
}

export const productApi = {
    getAll: async <T = unknown>(params?: any) => {
        const response = await apiClient.get("/products", { params });
        return response.data as ApiResponse<PageResponse<T>>;
    },
    getById: async (id: string) => {
        const response = await apiClient.get(`/products/${id}`);
        return response.data;
    },
    create: async (data: ProductPayload) => {
        const response = await apiClient.post("/products", data);
        return response.data;
    },
    update: async (id: string, data: ProductPayload) => {
        const response = await apiClient.put(`/products/${id}`, data);
        return response.data;
    },
    updateStatus: async (id: string, status: string) => {
        const response = await apiClient.patch(`/products/${id}/status`, null, { params: { status } });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
    }
};
