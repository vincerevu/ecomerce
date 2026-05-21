import apiClient from "./apiClient";

export interface Banner {
    id: string;
    title: string;
    imageUrl: string;
    linkUrl?: string;
    position: string;
    priority: number;
    active: boolean;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface PaginatedResult<T> {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    data: T[];
}

export const bannerApi = {
    getPage: async (params?: Record<string, string | number>) => {
        const response = await apiClient.get<{
            code: number;
            message: string;
            result: PaginatedResult<Banner>;
        }>("/banners", { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await apiClient.get<{
            code: number;
            message: string;
            result: Banner;
        }>(`/banners/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post<{
            code: number;
            message: string;
            result: Banner;
        }>("/banners", data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await apiClient.put<{
            code: number;
            message: string;
            result: Banner;
        }>(`/banners/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await apiClient.delete<{
            code: number;
            message: string;
        }>(`/banners/${id}`);
        return response.data;
    }
};
