import apiClient from "./apiClient";

export interface CustomerMembershipTier {
  id: string;
  tierName: string;
  minSpent?: number;
  discountPercent?: number;
  description?: string;
}

export interface CustomerRole {
  name: string;
  description?: string;
}

export interface CustomerRecord {
  id: string;
  phone: string;
  name: string;
  gender?: string;
  email?: string;
  type: string;
  active: boolean;
  dateOfBirth?: string;
  createdAt?: string;
  totalSpent?: number;
  totalPoints?: number;
  membershipTier?: CustomerMembershipTier | null;
  roles?: CustomerRole[];
}

export const customerApi = {
  getById: async (id: string) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: {
    phone: string;
    password: string;
    name: string;
    email?: string;
    gender?: string;
    dateOfBirth?: string;
    active?: boolean;
  }) => {
    const response = await apiClient.post("/users", data);
    return response.data;
  },
  getCustomers: async (params?: Record<string, string | number>) => {
    const response = await apiClient.get("/users/customers", { params });
    return response.data;
  },
  update: async (
    id: string,
    data: {
      phone: string;
      name: string;
      email?: string;
      gender?: string;
      dateOfBirth?: string;
      active?: boolean;
    },
  ) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },
  updateStatus: async (id: string, active: boolean) => {
    const response = await apiClient.patch(`/users/${id}/active`, null, {
      params: { active },
    });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};
