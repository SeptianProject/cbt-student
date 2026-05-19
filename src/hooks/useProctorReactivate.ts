"use client";

import { useCallback, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { updateAuthState, clearForceExit } from "@/store/authSlice";
import { authService } from "@/services/auth";

interface UseProctorReactivateResult {
  isChecking: boolean;
  error: string | null;
  isReactivated: boolean;
  checkReactivationStatus: () => Promise<boolean>;
}

/**
 * Hook untuk menangani reactivation dari proctor
 * - Refetch state user dari backend
 * - Jika is_active=true dan is_logout=false, user bisa lanjut
 * - Jika masih lockout, tetap di lock screen
 * - Polling atau refresh manual bisa dilakukan
 */
export function useProctorReactivate(): UseProctorReactivateResult {
  const dispatch = useAppDispatch();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReactivated, setIsReactivated] = useState(false);

  const checkReactivationStatus = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setError(null);

    try {
      // Fetch latest auth state from backend without depending on exam_id.
      // Using heartbeat avoids accidental /status requests with invalid exam IDs.
      const response = await authService.heartbeat();

      // Update Redux auth state with latest values
      dispatch(
        updateAuthState({
          is_active: response.is_active,
          is_logout: response.is_logout,
        }),
      );

      // Check if user has been reactivated
      if (response.is_active && !response.is_logout) {
        setIsReactivated(true);
        // Clear force exit flag if it was set
        dispatch(clearForceExit());
        return true;
      } else {
        setIsReactivated(false);
        return false;
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memeriksa status reactivation";
      setError(message);
      setIsReactivated(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [dispatch]);

  return {
    isChecking,
    error,
    isReactivated,
    checkReactivationStatus,
  };
}
