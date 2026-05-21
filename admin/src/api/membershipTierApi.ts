import apiClient from "./apiClient";

export interface MembershipTierRecord {
  id: string;
  tierName: string;
  minSpent?: number;
  discountPercent?: number;
  description?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const membershipTierApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<MembershipTierRecord[]>>("/membership-tiers");
    return response.data;
  },
};
