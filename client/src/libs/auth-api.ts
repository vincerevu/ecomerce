import apiClient from "@/libs/api-client";
import type { AuthSession } from "@/types/auth";

type RegisterPayload = {
  name: string;
  phone: string;
  password: string;
  otp: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
};

type ResetPasswordPayload = {
  phone: string;
  otp: string;
  newPassword: string;
};

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export const normalizePhone = (value: string) => digitsOnly(value).slice(0, 10);

export const login = async (
  identifier: string,
  password: string,
): Promise<AuthSession> => {
  const response: any = await apiClient.post("/auth/login", {
    phone: identifier.trim(),
    password,
  });

  return response.result as AuthSession;
};

export const sendRegisterOtp = async (phone: string) => {
  await apiClient.post("/auth/register/send-otp", {
    phone: normalizePhone(phone),
  });
};

export const lookupPhone = async (phone: string) => {
  const response: any = await apiClient.post("/auth/lookup-phone", {
    phone: normalizePhone(phone),
  });

  return response.result as { existed: boolean };
};

export const register = async (payload: RegisterPayload) => {
  await apiClient.post("/auth/register", {
    ...payload,
    phone: normalizePhone(payload.phone),
    dateOfBirth: payload.dateOfBirth || null,
    gender: payload.gender || null,
  });
};

export const sendForgotPasswordOtp = async (phone: string) => {
  await apiClient.post("/auth/forgot-password/send-otp", {
    phone: normalizePhone(phone),
  });
};

export const resetPassword = async (payload: ResetPasswordPayload) => {
  await apiClient.post("/auth/forgot-password/complete", {
    ...payload,
    phone: normalizePhone(payload.phone),
  });
};
