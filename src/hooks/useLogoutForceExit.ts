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

export function useLogoutForceExit(): UseLogoutForceExitResult {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Deklarasi handleLogoutNormal LEBIH DULU agar bisa dipakai di handleLogoutDuringExam
  const handleLogoutNormal = useCallback(async () => {
    try {
      await authService.logout();

      if (typeof window !== "undefined") {
        localStorage.removeItem("force_exit");
        localStorage.removeItem("force_exit_reason");
        localStorage.removeItem("session_token");
        localStorage.removeItem("session_id");
        localStorage.removeItem("exam_id");
      }

      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      router.push("/");
    }
  }, [router]);

  const handleLogoutDuringExam = useCallback(async () => {
    try {
      const examId =
        typeof window !== "undefined" ? localStorage.getItem("exam_id") : null;
      const sessionToken =
        typeof window !== "undefined"
          ? localStorage.getItem("session_token")
          : null;

      if (examId && sessionToken) {
        try {
          await authService.examForceExit(parseInt(examId));
        } catch (error) {
          console.warn("Failed to call force-exit endpoint:", error);
        }

        dispatch(setForceExit());

        if (typeof window !== "undefined") {
          localStorage.setItem("force_exit", "true");
          localStorage.setItem(
            "force_exit_reason",
            "manual_logout_during_exam",
          );
        }

        router.push("/dashboard");
      } else {
        await handleLogoutNormal();
      }
    } catch (error) {
      console.error("Error during logout:", error);
      await handleLogoutNormal();
    }
  }, [dispatch, router, handleLogoutNormal]);

  return {
    handleLogoutDuringExam,
    handleLogoutNormal,
  };
}
