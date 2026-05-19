"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateAuthState, setForceExit } from "@/store/authSlice";
import { stateSyncService } from "@/services/sync";
import { useRouter } from "next/navigation";

/**
 * Hook untuk mengelola sinkronisasi state antara frontend dan backend
 * Ensures:
 * - State always synced with backend
 * - Detects and handles state mismatches
 * - Handles session token loss
 * - Manages page reloads during active exam
 */
export function useStateSynchronization() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { is_active, is_logout, token } = useAppSelector((state) => state.auth);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Listen for visibility change and sync state on page visibility
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && token) {
        // Page became visible, sync state
        try {
          const authState = await stateSyncService.syncAuthState();
          if (authState) {
            dispatch(
              updateAuthState({
                is_active: authState.is_active,
                is_logout: authState.is_logout,
              }),
            );

            if (authState.force_exit) {
              dispatch(setForceExit());
              router.push("/exam/locked");
            }
          }
        } catch (error) {
          console.error("Error syncing state on visibility change:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [token, dispatch, router]);

  // Periodic state sync (every 5 minutes)
  useEffect(() => {
    if (!token || is_logout) return;

    const syncState = async () => {
      try {
        const authState = await stateSyncService.syncAuthState();
        if (authState) {
          dispatch(
            updateAuthState({
              is_active: authState.is_active,
              is_logout: authState.is_logout,
            }),
          );

          if (authState.force_exit) {
            dispatch(setForceExit());
          }
        }
      } catch (error) {
        // Silently ignore sync errors, will be handled by heartbeat
      }
    };

    syncIntervalRef.current = setInterval(syncState, 5 * 60 * 1000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [token, is_logout, dispatch]);

  // Handle window focus change
  useEffect(() => {
    const handleWindowFocus = async () => {
      if (token && is_active && !is_logout) {
        try {
          const authState = await stateSyncService.syncAuthState();
          if (authState) {
            dispatch(
              updateAuthState({
                is_active: authState.is_active,
                is_logout: authState.is_logout,
              }),
            );
          }
        } catch (error) {
          // Silently ignore errors
        }
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [token, is_active, is_logout, dispatch]);
}
