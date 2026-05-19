"use client";

import { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setForceExit, clearForceExit } from "@/store/authSlice";
import { useRouter } from "next/navigation";

interface UseForceExitDetectionResult {
  isForceExited: boolean;
  forceExitReason: string | null;
  acknowledgeForceExit: () => void;
}

/**
 * Hook untuk mendeteksi force exit state changes
 * - Monitor is_active=1 dan is_logout=1 condition
 * - Monitor force_exit flag dari Redux
 * - Redirect ke locked page saat terdeteksi
 * - Provide way untuk acknowledge dan continue checking
 */
export function useForceExitDetection(): UseForceExitDetectionResult {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { is_active, is_logout, force_exit } = useAppSelector(
    (state) => state.auth,
  );
  const [isForceExited, setIsForceExited] = useState(false);
  const [forceExitReason, setForceExitReason] = useState<string | null>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Check if force exit condition is met: is_active=1 && is_logout=1 OR force_exit flag
    const isForcedExit = force_exit || (is_active && is_logout);

    if (isForcedExit && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setIsForceExited(true);

      // Determine reason
      let reason = "unknown";
      if (force_exit) {
        reason = localStorage.getItem("force_exit_reason") || "force_exit_flag";
      } else if (is_active && is_logout) {
        reason = "is_active_and_is_logout";
      }
      setForceExitReason(reason);

      // Ensure Redux state reflects this
      if (!force_exit) {
        dispatch(setForceExit());
      }

      // Save to localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("force_exit", "true");
        localStorage.setItem("force_exit_reason", reason);
      }

      // Redirect after a short delay to allow state updates
      const timer = setTimeout(() => {
        router.push("/exam/locked");
      }, 500);

      return () => clearTimeout(timer);
    }

    // Reset if not force exited
    if (!isForcedExit && isForceExited) {
      setIsForceExited(false);
      setForceExitReason(null);
      hasTriggeredRef.current = false;
    }
  }, [force_exit, is_active, is_logout, dispatch, router, isForceExited]);

  const acknowledgeForceExit = () => {
    // Reset flag so we can detect next force exit
    hasTriggeredRef.current = false;
    setIsForceExited(false);
    setForceExitReason(null);
    dispatch(clearForceExit());
  };

  return {
    isForceExited,
    forceExitReason,
    acknowledgeForceExit,
  };
}
