export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      const detail = error.response.data?.detail;
      if (detail === "Token expired" || detail === "Invalid token") {
        originalRequest._retry = true;
        try {
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const refreshTkn = localStorage.getItem("findora.refresh");
              if (!refreshTkn) throw new Error("No refresh token");
              const res = await axios.post(`${config.apiBaseUrl}/auth/refresh`, { refresh_token: refreshTkn });
              const { access_token, refresh_token } = res.data;
              setTokens({ access_token, refresh_token });
              return access_token;
            })();
          }
          const newToken = await refreshPromise;
          refreshPromise = null;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          refreshPromise = null;
          clearTokens();
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
