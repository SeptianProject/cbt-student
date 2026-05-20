import api from "@/lib/api";
import { ExamStatusResponse } from "@/types";

/**
 * Service untuk memastikan state frontend selalu sinkron dengan backend
 * Handles:
 * - Session token loss
 * - State desynchronization
 * - Page reload during active exam
 */

export const stateSyncService = {
  /**
   * Check if user is still authenticated
   * Returns true if token is valid, false otherwise
   */
  checkAuth: async (): Promise<boolean> => {
    try {
      if (typeof window === "undefined") return false;

      const token = localStorage.getItem("api_token");
      if (!token) return false;

      const response = await api.get("/siswa/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.status === 200;
    } catch {
      return false;
    }
  },

  /**
   * Verify session token is still valid
   */
  verifySessionToken: async (): Promise<boolean> => {
    try {
      if (typeof window === "undefined") return false;

      const sessionToken = localStorage.getItem("session_token");
      const examId = localStorage.getItem("exam_id");

      if (!sessionToken || !examId) return false;

      const response = await api.post(`/siswa/exams/${examId}/status`, {
        session_token: sessionToken,
      });

      return response.status === 200;
    } catch {
      return false;
    }
  },

  /**
   * Sync exam state with backend
   * Returns latest exam status from backend
   */
  syncExamState: async (examId: number): Promise<ExamStatusResponse | null> => {
    try {
      const response = await api.get<ExamStatusResponse>(
        `/siswa/exams/${examId}/status`,
      );
      return response.data;
    } catch {
      console.error("Error syncing exam state");
      return null;
    }
  },

  /**
   * On page reload during exam, verify session is still valid
   * If not, handle gracefully
   */
  handlePageReload: async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    const examId = localStorage.getItem("exam_id");
    const sessionToken = localStorage.getItem("session_token");

    if (!examId || !sessionToken) {
      return false;
    }

    try {
      const isValid = await stateSyncService.verifySessionToken();
      return isValid;
    } catch (error) {
      console.error("Error verifying session on page reload:", error);
      return false;
    }
  },

  /**
   * Clear all invalid session data
   */
  clearInvalidSession: (): void => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("session_token");
    localStorage.removeItem("session_id");
    localStorage.removeItem("exam_id");
    localStorage.removeItem("exam_duration");
  },
};
