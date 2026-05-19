"use client";

import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setForceExit } from "@/store/authSlice";
import { authService } from "@/services/auth";
import { useRouter } from "next/navigation";

interface UseLogoutForceExitResult {
  handleLogoutDuringExam: () => Promise<void>;
  handleLogoutNormal: () => Promise<void>;
}

/**
 * Hook untuk handle logout dengan kemungkinan force exit
 * - Detect apakah logout terjadi saat ujian berlangsung
 * - Jika ada session_token, call force-exit endpoint
 * - Set force_exit flag di Redux dan localStorage
 * - Redirect ke locked page atau home sesuai konteks
 */
export function useLogoutForceExit(): UseLogoutForceExitResult {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogoutDuringExam = useCallback(async () => {
    try {
      // Get session info
      const examId =
        typeof window !== "undefined" ? localStorage.getItem("exam_id") : null;
      const sessionToken =
        typeof window !== "undefined"
          ? localStorage.getItem("session_token")
          : null;

      // If there's an active session, call force-exit
      if (examId && sessionToken) {
        try {
          await authService.examForceExit(parseInt(examId));
        } catch (error) {
          console.warn("Failed to call force-exit endpoint:", error);
          // Continue with local force exit even if API call fails
        }

        // Set force exit state
        dispatch(setForceExit());

        if (typeof window !== "undefined") {
          localStorage.setItem("force_exit", "true");
          localStorage.setItem(
            "force_exit_reason",
            "manual_logout_during_exam",
          );
        }

        // Redirect to locked page
        router.push("/exam/locked");
      } else {
        // No active exam session, do normal logout
        await handleLogoutNormal();
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback to normal logout
      await handleLogoutNormal();
    }
  }, [dispatch, router]);

  const handleLogoutNormal = useCallback(async () => {
    try {
      // Call logout endpoint
      await authService.logout();

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("force_exit");
        localStorage.removeItem("force_exit_reason");
        localStorage.removeItem("session_token");
        localStorage.removeItem("session_id");
        localStorage.removeItem("exam_id");
      }

      // Redirect to home
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, clear local state and redirect
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      router.push("/");
    }
  }, [router]);

  return {
    handleLogoutDuringExam,
    handleLogoutNormal,
  };
}
