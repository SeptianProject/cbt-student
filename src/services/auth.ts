import api from "@/lib/api";
import {
  DashboardExam,
  User,
  ExamStartResponse,
  ExamSubmitRequest,
  ExamSubmitResponse,
  ExamStatusResponse,
} from "@/types";
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
      // Enhanced error handling untuk memberikan pesan yang jelas ke UI
      if (axios.isAxiosError(error)) {
        // Locked account should return 403 from backend
        if (error.response?.status === 403) {
          throw new Error(
            "Akun Anda terkunci. Hubungi pengawas untuk membuka kunci.",
          );
        }

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

      // Jika bukan axios error atau tidak tertangani di atas, lempar ulang
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    await api.post("/logout");
    if (typeof window !== "undefined") {
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

  // Exam-related endpoints
  examStart: async (examId: number): Promise<ExamStartResponse> => {
    const response = await api.post<ExamStartResponse>(
      `/siswa/exams/${examId}/start`,
      {},
    );
    if (
      typeof window !== "undefined" &&
      response.data.session_token &&
      response.data.session_id
    ) {
      localStorage.setItem("session_token", response.data.session_token);
      localStorage.setItem("session_id", response.data.session_id.toString());
      localStorage.setItem("exam_id", examId.toString());
    }
    return response.data;
  },

  examSubmit: async (
    examId: number,
    data: ExamSubmitRequest,
  ): Promise<ExamSubmitResponse> => {
    const response = await api.post<ExamSubmitResponse>(
      `/siswa/exams/${examId}/submit`,
      data,
    );
    // Don't unwrap submit response - keep full structure for validation
    return response.data;
  },

  examForceExit: async (examId: number): Promise<{ success: boolean }> => {
    const sessionToken =
      typeof window !== "undefined"
        ? localStorage.getItem("session_token")
        : null;
    const response = await api.post<{ success: boolean }>("/exam/force-exit", {
      exam_id: examId,
      session_token: sessionToken,
    });
    return response.data;
  },

  examStatus: async (examId: number): Promise<ExamStatusResponse> => {
    const response = await api.get<ExamStatusResponse>(
      `/siswa/exams/${examId}/status`,
    );
    return response.data;
  },

  proctorReactivate: async (
    studentId: number,
  ): Promise<{ success: boolean; user: User }> => {
    const response = await api.post<{ success: boolean; user: User }>(
      `/proctor/reactivate`,
      {
        student_id: studentId,
      },
    );
    return response.data;
  },
};
