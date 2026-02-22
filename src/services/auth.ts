import api from "@/lib/api";
import { DashboardExam, User } from "@/types";
import axios from "axios";

export const authService = {
  login: async (
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> => {
    try {
      const response = await api.post<{ user: User; token: string }>("/login", {
        email,
        password,
      });
      if (typeof window !== "undefined" && response.data.token) {
        localStorage.setItem("api_token", response.data.token);
      }
      return response.data;
    } catch (error) {
      // Enhanced error logging untuk debugging
      console.error("Login failed:", error);
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new Error(
            "Request timeout - Server tidak merespons. Cek koneksi internet atau coba lagi.",
          );
        }
        if (!error.response) {
          throw new Error(
            "Network error - Tidak dapat terhubung ke server. Cek CORS atau API URL.",
          );
        }
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    await api.post("/logout");
    if (typeof window !== "undefined") {
      // Clear all authentication and session data
      localStorage.removeItem("api_token");
      localStorage.removeItem("exam_id");
      localStorage.removeItem("exam_duration");
      localStorage.removeItem("exam_statuses");
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_id");
      localStorage.removeItem("exam_result");
      localStorage.removeItem("current_exam_slug");
    }
  },

  clearAllSessions: async (): Promise<void> => {
    // Clear all session data without calling API
    if (typeof window !== "undefined") {
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_id");
      localStorage.removeItem("exam_result");
      localStorage.removeItem("current_exam_slug");
      localStorage.removeItem("exam_id");
      localStorage.removeItem("exam_duration");
    }
  },

  getCurrentUser: async (): Promise<DashboardExam> => {
    const response = await api.get("/siswa/dashboard", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("api_token")}`,
      },
    });
    return response.data;
  },

  heartbeat: async (): Promise<void> => {
    await api.post("/siswa/heartbeat");
  },
};
