import api from "@/lib/api";
import { ExamStatusResponse, HeartbeatResponse } from "@/types";

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error("Error syncing exam state:", error);
      return null;
    }
  },

  /**
   * Check user's current auth state from backend
   * Returns latest is_active and is_logout flags
   */
  syncAuthState: async (): Promise<HeartbeatResponse | null> => {
    try {
      const response = await api.post<HeartbeatResponse>("/siswa/heartbeat");
      return response.data;
    } catch (error) {
      console.error("Error syncing auth state:", error);
      return null;
    }
  },

  /**
   * Handle state mismatch between frontend and backend
   * Called when frontend detects state that doesn't match backend
   */
  handleStateMismatch: async (): Promise<void> => {
    if (typeof window === "undefined") return;

    try {
      // Attempt to sync auth state first
      const authState = await stateSyncService.syncAuthState();

      if (!authState) {
        // If can't reach backend, redirect to home
        window.location.href = "/";
        return;
      }

      // If forced to lockout, redirect
      if (
        !authState.is_active ||
        (authState.is_active === false && authState.is_logout === false)
      ) {
        localStorage.setItem("force_exit", "true");
        window.location.href = "/exam/locked";
        return;
      }

      // If logged out, redirect to home
      if (authState.is_logout === true) {
        localStorage.removeItem("api_token");
        window.location.href = "/";
        return;
      }
    } catch (error) {
      console.error("Error handling state mismatch:", error);
      window.location.href = "/";
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
