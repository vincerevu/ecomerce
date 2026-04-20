import apiClient from "./api-client";

type ApiResponse<T> = {
  code: number;
  message: string;
  result: T;
};

export type UserProfileResponse = {
  id: string;
  phone?: string | null;
  email?: string | null;
  name: string;
  gender?: string | null;
  type?: string | null;
  active?: boolean;
  dateOfBirth?: string | null;
  totalSpent?: number | null;
  totalPoints?: number | null;
};

export type UpdateUserProfilePayload = {
  name?: string;
  phone?: string;
  email?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth?: string | null;
  address?: string | null;
};

export const userApi = {
  getMyInfo: async () =>
    (await apiClient.get("/users/my-info")) as ApiResponse<UserProfileResponse>,
  updateProfile: async (payload: UpdateUserProfilePayload) =>
    (await apiClient.put("/users/profile", payload)) as ApiResponse<UserProfileResponse>,
};
