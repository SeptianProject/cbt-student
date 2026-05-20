"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setForceExit, updateAuthState } from "@/store/authSlice";
import { authService } from "@/services/auth";

interface CheatDetectionOptions {
  enabled?: boolean;
  onCheatDetected?: () => void;
  debugMode?: boolean;
}

/**
 * Hook untuk mendeteksi kecurangan saat ujian berlangsung
 * Mendeteksi:
 * 1. Visibility change (tab switch/minimize)
 * 2. Window blur (focus loss)
 * 3. beforeunload (attempt to navigate away)
 *
 * Saat terdeteksi:
 * - Panggil force-exit endpoint
 * - Update auth state (is_active=1, is_logout=1)
 * - Update localStorage dengan force_exit flag
 * - Pindahkan user ke lock screen
 * - User perlu reactivate dari proctor
 */
export function useCheatDetection(options: CheatDetectionOptions = {}) {
  const { enabled = true, onCheatDetected, debugMode = false } = options;

  const router = useRouter();
  const dispatch = useAppDispatch();
  const { is_active, is_logout } = useAppSelector((state) => state.auth);
  const sessionStatus = useAppSelector((state) => state.exam.sessionStatus);
  const isSubmitting = useAppSelector((state) => state.exam.isSubmitting);
  const examId = useAppSelector((state) => state.exam.currentExam?.exam_id);
  const cheatReportedRef = useRef(false);
  const mountedAtRef = useRef<number>(Date.now());
  const monitoringDelayMs = 4000; // Wait 4 seconds before monitoring starts

  const isMonitoringReady = useCallback(
    () => Date.now() - mountedAtRef.current >= monitoringDelayMs,
    [],
  );

  useEffect(() => {
    const submitInProgressFlag =
      typeof window !== "undefined" &&
      localStorage.getItem("exam_submit_in_progress") === "true";

    console.log("[CHEAT GUARD CHECK]", {
      enabled,
      sessionStatus,
      is_active,
      is_logout,
      isSubmitting,
      submitInProgressFlag,
      examId,
    });
  }, [enabled, sessionStatus, is_active, is_logout, isSubmitting, examId]);

  const handleRedirectToLocked = useCallback(() => {
    // Clear exam session data
    if (typeof window !== "undefined") {
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_id");
      localStorage.removeItem("exam_result");
      localStorage.removeItem("current_exam_slug");
    }

    // Use router.push for client-side navigation (SSR safe)
    // Fallback to window.location if router fails
    try {
      router.push("/dashboard");
    } catch (err) {
      if (debugMode)
        console.error("Router push failed, using window.location:", err);
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    }
  }, [router, debugMode]);

  const triggerForceExit = useCallback(
    async (reason: string) => {
      try {
        console.log("[CHEAT DETECTED]", {
          trigger: reason,
          timestamp: new Date(),
        });
        if (debugMode) console.log(`Cheat detected: ${reason}`);
        if (onCheatDetected) onCheatDetected();

        // Call force-exit endpoint with exam_id (best-effort)
        if (examId) {
          try {
            await authService.examForceExit(examId);
            if (debugMode) console.log("Force exit API call successful");
          } catch (apiError) {
            console.error(
              `Error calling force-exit API (${reason}):`,
              apiError,
            );
            // Continue even if API call fails
          }
        }

        // Update auth state - locked status
        dispatch(
          updateAuthState({
            is_active: true,
            is_logout: true,
          }),
        );

        // Update force exit Redux state
        dispatch(setForceExit());

        // Set localStorage flags for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("force_exit", "true");
          localStorage.setItem("force_exit_reason", reason.toLowerCase());
          localStorage.setItem("user_is_active", "1");
          localStorage.setItem("user_is_logout", "1");
        }

        // Redirect to locked page after short delay
        setTimeout(() => {
          handleRedirectToLocked();
        }, 300);
      } catch (error) {
        console.error(
          `Unexpected error in cheat detection (${reason}):`,
          error,
        );
        // Even if unexpected error, lock the UI locally
        dispatch(setForceExit());
        dispatch(
          updateAuthState({
            is_active: true,
            is_logout: true,
          }),
        );
        if (typeof window !== "undefined") {
          localStorage.setItem("force_exit", "true");
          localStorage.setItem(
            "force_exit_reason",
            `${reason.toLowerCase()}_error`,
          );
        }
        // Still redirect even on error
        setTimeout(() => {
          handleRedirectToLocked();
        }, 300);
      }
    },
    [examId, dispatch, onCheatDetected, debugMode, handleRedirectToLocked],
  );

  useEffect(() => {
    const submitInProgressFlag =
      typeof window !== "undefined" &&
      localStorage.getItem("exam_submit_in_progress") === "true";

    if (
      !enabled ||
      sessionStatus !== "progress" ||
      !is_active ||
      is_logout ||
      isSubmitting ||
      submitInProgressFlag
    ) {
      return;
    }

    const handleVisibilityChange = async () => {
      if (debugMode) console.log("Visibility changed:", document.hidden);

      if (!isMonitoringReady()) return;

      // When document becomes hidden (user switched tab or minimized)
      if (document.hidden && !cheatReportedRef.current) {
        cheatReportedRef.current = true;
        await triggerForceExit("TAB_SWITCH");
      }
    };

    const handleWindowBlur = async () => {
      if (debugMode) console.log("Window blurred");

      if (!isMonitoringReady()) return;

      if (!cheatReportedRef.current) {
        cheatReportedRef.current = true;
        await triggerForceExit("WINDOW_BLUR");
      }
    };

    const sendBeaconForceExit = (reason: string) => {
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.sendBeacon &&
          examId
        ) {
          const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
          const url = `${base.replace(/\/$/, "")}/exam/force-exit`;
          const session_token =
            typeof window !== "undefined"
              ? localStorage.getItem("session_token")
              : null;
          const payload = JSON.stringify({
            exam_id: examId,
            session_token,
            reason,
          });
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(url, blob);
          if (debugMode) console.log("Sent beacon to force-exit endpoint", url);
        }
      } catch (err) {
        if (debugMode) console.error("Beacon send failed", err);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (debugMode) console.log("Before unload triggered");

      const submitInProgress =
        typeof window !== "undefined" &&
        localStorage.getItem("exam_submit_in_progress") === "true";

      if (!isMonitoringReady() || submitInProgress) return;

      if (!cheatReportedRef.current) {
        cheatReportedRef.current = true;
        // Try to send a synchronous beacon so the backend knows immediately
        sendBeaconForceExit("BEFORE_UNLOAD");
        // Also attempt async request (best-effort)
        void triggerForceExit("BEFORE_UNLOAD");

        // Standard beforeunload UX behaviour
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handleKeyDown = async (ev: KeyboardEvent) => {
      // Best-effort detection for Alt+Tab / Cmd+Tab when the browser receives it.
      if (ev.key !== "Tab" || (!ev.altKey && !ev.metaKey)) {
        return;
      }

      if (cheatReportedRef.current || !isMonitoringReady()) {
        return;
      }

      cheatReportedRef.current = true;
      await triggerForceExit("ALT_TAB");
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      // Remove event listeners on cleanup
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    is_active,
    is_logout,
    sessionStatus,
    isSubmitting,
    examId,
    dispatch,
    onCheatDetected,
    debugMode,
    isMonitoringReady,
    triggerForceExit,
  ]);
}
