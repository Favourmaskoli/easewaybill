// "use client";

// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// import { authApi } from "../api/auth.api";
// import type { AuthUser, LoginDto, RegisterDto } from "../types/api.types";

// interface AuthState {
//   user: AuthUser | null;
//   accessToken: string | null;
//   refreshToken: string | null;
//   isLoading: boolean;
//   error: string | null;
//   hasHydrated: boolean;
//   setHasHydrated: (value: boolean) => void;
//   login: (dto: LoginDto) => Promise<void>;
//   register: (dto: RegisterDto) => Promise<void>;
//   logout: () => Promise<void>;
//   forgotPassword: (dto: ForgotPasswordDto) => Promise<void>;
//   resetPassword: (dto: ResetPasswordDto) => Promise<void>;
//   clearError: () => void;
//   setUser: (user: AuthUser) => void;
// }

// type PersistedAuth = Pick<AuthState, "user" | "accessToken" | "refreshToken">;

// export const useAuth = create<AuthState>()(
//   persist<AuthState, [], [], PersistedAuth>(
//     (set) => ({
//       user: null,
//       accessToken: null,
//       refreshToken: null,
//       isLoading: false,
//       error: null,
//       hasHydrated: false,

//       setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

//       login: async (dto: LoginDto) => {
//         set({ isLoading: true, error: null });
//         try {
//           const data = await authApi.login(dto);
//           localStorage.setItem("accessToken", data.accessToken);
//           localStorage.setItem("refreshToken", data.refreshToken);
//           set({
//             user: data.user,
//             accessToken: data.accessToken,
//             refreshToken: data.refreshToken,
//             isLoading: false,
//           });
//         } catch (err: unknown) {
//           const message =
//             (err as { response?: { data?: { message?: string } } })?.response
//               ?.data?.message ?? "Invalid email or password";
//           set({ error: message, isLoading: false });
//           throw err;
//         }
//       },

//       register: async (dto: RegisterDto) => {
//         set({ isLoading: true, error: null });
//         try {
//           const data = await authApi.register(dto);
//           localStorage.setItem("accessToken", data.accessToken);
//           localStorage.setItem("refreshToken", data.refreshToken);
//           set({
//             user: data.user,
//             accessToken: data.accessToken,
//             refreshToken: data.refreshToken,
//             isLoading: false,
//           });
//         } catch (err: unknown) {
//           const message = (
//             err as { response?: { data?: { message?: string | string[] } } }
//           )?.response?.data?.message;
//           const errorText = Array.isArray(message)
//             ? message[0]
//             : (message ?? "Registration failed");
//           set({ error: errorText, isLoading: false });
//           throw err;
//         }
//       },

//       logout: async () => {
//         try {
//           await authApi.logout();
//         } catch {
//           // ignore
//         }
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("refreshToken");
//         set({ user: null, accessToken: null, refreshToken: null });
//         window.location.href = "/sign-in";
//       },

//       clearError: () => set({ error: null }),

//       setUser: (user: AuthUser) => set({ user }),
//     }),
//     {
//       name: "easewaybill-auth",
//       partialize: (state): PersistedAuth => ({
//         user: state.user,
//         accessToken: state.accessToken,
//         refreshToken: state.refreshToken,
//       }),
//       onRehydrateStorage: () => (state) => {
//         state?.setHasHydrated(true);
//       },
//     },
//   ),
// );

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../api/auth.api";
import type {
  AuthUser,
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../types/api.types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;

  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;

  forgotPassword: (dto: ForgotPasswordDto) => Promise<void>;
  resetPassword: (dto: ResetPasswordDto) => Promise<void>;

  clearError: () => void;
  setUser: (user: AuthUser) => void;
}

type PersistedAuth = Pick<
  AuthState,
  "user" | "accessToken" | "refreshToken"
>;

export const useAuth = create<AuthState>()(
  persist<AuthState, [], [], PersistedAuth>(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setHasHydrated: (value: boolean) => {
        set({ hasHydrated: value });
      },

      // ─────────────────────────────────────────────
      // LOGIN
      // ─────────────────────────────────────────────
      login: async (dto: LoginDto) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const data = await authApi.login(dto);

          localStorage.setItem(
            "accessToken",
            data.accessToken,
          );

          localStorage.setItem(
            "refreshToken",
            data.refreshToken,
          );

          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            (
              err as {
                response?: {
                  data?: {
                    message?: string | string[];
                  };
                };
              }
            )?.response?.data?.message;

          const errorText = Array.isArray(message)
            ? message[0]
            : (message ?? "Invalid email or password");

          set({
            error: errorText,
            isLoading: false,
          });

          throw err;
        }
      },

      // ─────────────────────────────────────────────
      // REGISTER
      // ─────────────────────────────────────────────
      register: async (dto: RegisterDto) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          const data = await authApi.register(dto);

          localStorage.setItem(
            "accessToken",
            data.accessToken,
          );

          localStorage.setItem(
            "refreshToken",
            data.refreshToken,
          );

          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            (
              err as {
                response?: {
                  data?: {
                    message?: string | string[];
                  };
                };
              }
            )?.response?.data?.message;

          const errorText = Array.isArray(message)
            ? message[0]
            : (message ?? "Registration failed");

          set({
            error: errorText,
            isLoading: false,
          });

          throw err;
        }
      },

      // ─────────────────────────────────────────────
      // FORGOT PASSWORD
      // ─────────────────────────────────────────────
      forgotPassword: async (dto: ForgotPasswordDto) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          await authApi.forgotPassword(dto);

          set({
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            (
              err as {
                response?: {
                  data?: {
                    message?: string | string[];
                  };
                };
              }
            )?.response?.data?.message;

          const errorText = Array.isArray(message)
            ? message[0]
            : (
                message ??
                "Unable to process password reset request"
              );

          set({
            error: errorText,
            isLoading: false,
          });

          throw err;
        }
      },

      // ─────────────────────────────────────────────
      // RESET PASSWORD
      // ─────────────────────────────────────────────
      resetPassword: async (dto: ResetPasswordDto) => {
        set({
          isLoading: true,
          error: null,
        });

        try {
          await authApi.resetPassword(dto);

          set({
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            (
              err as {
                response?: {
                  data?: {
                    message?: string | string[];
                  };
                };
              }
            )?.response?.data?.message;

          const errorText = Array.isArray(message)
            ? message[0]
            : (
                message ??
                "Unable to reset password"
              );

          set({
            error: errorText,
            isLoading: false,
          });

          throw err;
        }
      },

      // ─────────────────────────────────────────────
      // LOGOUT
      // ─────────────────────────────────────────────
      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout API errors.
          // We still clear local authentication state.
        }

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        });

        window.location.href = "/sign-in";
      },

      // ─────────────────────────────────────────────
      // CLEAR ERROR
      // ─────────────────────────────────────────────
      clearError: () => {
        set({
          error: null,
        });
      },

      // ─────────────────────────────────────────────
      // SET USER
      // ─────────────────────────────────────────────
      setUser: (user: AuthUser) => {
        set({
          user,
        });
      },
    }),

    {
      name: "easewaybill-auth",

      partialize: (state): PersistedAuth => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
