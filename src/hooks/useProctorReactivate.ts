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
 * - Mengecek state user terbaru dari backend saat tombol ditekan
 * - Jika is_active=true dan is_logout=false, user bisa lanjut
 * - Jika masih lockout, tetap di lock screen
 */
export function useProctorReactivate(): UseProctorReactivateResult {
  const dispatch = useAppDispatch();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReactivated, setIsReactivated] = useState(false);

  const checkReactivationStatus = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setError(null);
    setIsReactivated(false);

    try {
      // Fetch latest user data from backend to get current auth state
      const dashboardData = await authService.getCurrentUser();
      const userIsActive = dashboardData.student?.user?.is_active ?? false;
      const userIsLogout = dashboardData.student?.user?.is_logout ?? false;

      // Update Redux auth state with latest values
      dispatch(
        updateAuthState({
          is_active: userIsActive,
          is_logout: userIsLogout,
        }),
      );

      // Check if user has been reactivated
      if (userIsActive && !userIsLogout) {
        setIsReactivated(true);
        // Clear force exit flag if it was set
        dispatch(clearForceExit());
        return true;
      } else {
        setIsReactivated(false);
        setError("Akun belum diaktifkan, hubungi pengawas");
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
