import apiClient from "./apiClient";

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
    sortOrder: number;
    parent?: { id: string; name: string };
    children?: Category[];
}

interface PaginatedResult<T> {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    data: T[];
}

export const categoryApi = {
    getAll: async () => {
        const response = await apiClient.get("/categories");
        return response.data;
    },
    getPage: async (params?: Record<string, string | number>) => {
        const response = await apiClient.get<{
            code: number;
            message: string;
            result: PaginatedResult<Category>;
        }>("/categories/page", { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await apiClient.get(`/categories/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post("/categories", data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await apiClient.put(`/categories/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await apiClient.delete(`/categories/${id}`);
        return response.data;
    }
};
