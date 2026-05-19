"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { updateAuthState, clearForceExit } from "@/store/authSlice";

/**
 * Hook untuk initialize auth state dari localStorage pada mount
 * Memastikan Redux state tersinkronisasi dengan localStorage values
 * Berguna untuk session persistence across refreshes
 */
export function useInitializeAuthState(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const is_active = localStorage.getItem("user_is_active") === "1";
      const is_logout = localStorage.getItem("user_is_logout") === "1";

      // Initialize Redux state from localStorage
      dispatch(
        updateAuthState({
          is_active,
          is_logout,
        }),
      );

      // Clear force_exit flag if account has been reactivated (is_active=true, is_logout=false)
      // This handles the case where account was locked but then proctor unlocked it
      if (is_active && !is_logout) {
        const forceExitFlag = localStorage.getItem("force_exit");
        if (forceExitFlag === "true") {
          // Account was locked but now reactivated - clear the flag
          dispatch(clearForceExit());
          localStorage.removeItem("force_exit");
          localStorage.removeItem("force_exit_reason");
        }
      }
    }
  }, [dispatch]);
}
