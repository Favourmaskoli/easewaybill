import { apiClient, unwrap } from "./client";
import type {
  AuthTokens,
  LoginDto,
  RegisterDto,
  AuthUser,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../types/api.types";

export const authApi = {
  login: (dto: LoginDto) =>
    apiClient.post<{ data: AuthTokens }>("/auth/login", dto).then(unwrap),

  register: (dto: RegisterDto) =>
    apiClient.post<{ data: AuthTokens }>("/auth/register", dto).then(unwrap),

  logout: () => apiClient.post("/auth/logout"),

  refresh: (refreshToken: string) =>
    apiClient
      .post<{ data: AuthTokens }>("/auth/refresh", { refreshToken })
      .then(unwrap),

  me: () => apiClient.get<{ data: AuthUser }>("/users/me").then(unwrap),

  updateProfile: (dto: Partial<AuthUser>) =>
    apiClient.patch<{ data: AuthUser }>("/users/me", dto).then(unwrap),

  // Email verification
  verifyEmail: (token: string) =>
    apiClient
      .post<{ data: { message: string } }>("/auth/verify-email", { token })
      .then(unwrap),

  resendVerification: (email: string) =>
    apiClient
      .post<{
        data: { message: string };
      }>("/auth/resend-verification", { email })
      .then(unwrap),

  // Password reset
  forgotPassword: (dto: ForgotPasswordDto) =>
    apiClient
      .post<{ data: { message: string } }>("/auth/forgot-password", dto)
      .then(unwrap),

  resetPassword: (dto: ResetPasswordDto) =>
    apiClient
      .post<{ data: { message: string } }>("/auth/reset-password", dto)
      .then(unwrap),
};
