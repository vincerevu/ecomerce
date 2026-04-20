export type AuthUser = {
  id: string;
  phone?: string | null;
  email?: string | null;
  name: string;
  gender?: string | null;
  type?: string | null;
  active?: boolean;
  dateOfBirth?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string | null;
  user: AuthUser;
};
