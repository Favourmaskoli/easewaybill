import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3010/api/v1";

// ── Helper: get token from localStorage or Zustand store ─────
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  // Check direct key first (set by useAuth on login)
  const direct = localStorage.getItem("accessToken");
  if (direct) return direct;

  // Fallback: read from Zustand persisted store
  try {
    const raw = localStorage.getItem("easewaybill-auth");
    if (raw) {
      const parsed = JSON.parse(raw) as {
        state?: { accessToken?: string };
      };
      return parsed?.state?.accessToken ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;

  const direct = localStorage.getItem("refreshToken");
  if (direct) return direct;

  try {
    const raw = localStorage.getItem("easewaybill-auth");
    if (raw) {
      const parsed = JSON.parse(raw) as {
        state?: { refreshToken?: string };
      };
      return parsed?.state?.refreshToken ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

// ── Create axios instance ─────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    // Required to bypass ngrok browser interstitial page
    "ngrok-skip-browser-warning": "true",
  },
});

// ── Request interceptor — attach access token ─────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — handle 401 token refresh ──────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = getStoredRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("easewaybill-auth");
        window.location.href = "/sign-in";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ── Helper to extract data from ApiResponse wrapper ──────────
export function unwrap<T>(response: AxiosResponse<{ data: T }>): T {
  return response.data.data;
}
