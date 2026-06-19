// import { apiClient, unwrap } from "./client";
// import type {
//   AuthTokens,
//   LoginDto,
//   RegisterDto,
//   AuthUser,
// } from "../types/api.types";

// export const authApi = {
//   login: (dto: LoginDto) =>
//     apiClient.post<{ data: AuthTokens }>("/auth/login", dto).then(unwrap),

//   register: (dto: RegisterDto) =>
//     apiClient.post<{ data: AuthTokens }>("/auth/register", dto).then(unwrap),

//   logout: () => apiClient.post("/auth/logout"),

//   refresh: (refreshToken: string) =>
//     apiClient
//       .post<{ data: AuthTokens }>("/auth/refresh", { refreshToken })
//       .then(unwrap),

//   me: () => apiClient.get<{ data: AuthUser }>("/users/me").then(unwrap),

//   updateProfile: (dto: Partial<AuthUser>) =>
//     apiClient.patch<{ data: AuthUser }>("/users/me", dto).then(unwrap),
// };

import { apiClient, unwrap } from "./client";
import type {
  AuthTokens,
  LoginDto,
  RegisterDto,
  AuthUser,
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
};
