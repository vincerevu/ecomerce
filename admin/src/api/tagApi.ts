import apiClient from "./apiClient";

export interface Tag {
    id: string;
    name: string;
    slug: string;
}

export const tagApi = {
    getAll: async () => {
        const response = await apiClient.get("/tags");
        return response.data;
    },
    getById: async (id: string) => {
        const response = await apiClient.get(`/tags/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post("/tags", data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await apiClient.put(`/tags/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await apiClient.delete(`/tags/${id}`);
        return response.data;
    }
};
