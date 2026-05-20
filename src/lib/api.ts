import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30000, // Increase to 30 seconds untuk login/submit requests
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("api_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes("/submit")) {
      return response;
    }

    if (response.data && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("api_token");
        localStorage.removeItem("session_token");
        localStorage.removeItem("session_id");
        // Redirect to home/login
        window.location.href = "/";
      }
    }

    // Handle 403 Forbidden with force_exit
    if (error.response?.status === 403) {
      const errorData = error.response.data;
      if (
        errorData?.force_exit === true ||
        errorData?.data?.force_exit === true
      ) {
        if (typeof window !== "undefined") {
          localStorage.setItem("force_exit", "true");
          localStorage.removeItem("session_token");
          localStorage.removeItem("session_id");
          window.location.href = "/dashboard";
        }
      }
    }

    // Handle 422 Validation Error (state mismatch)
    if (error.response?.status === 422) {
      const errorData = error.response.data;
      if (
        errorData?.message?.includes("sesi") ||
        errorData?.message?.includes("session")
      ) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("session_token");
          localStorage.removeItem("session_id");
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
