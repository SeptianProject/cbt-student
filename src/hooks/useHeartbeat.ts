"use client";

import { useEffect, useRef } from "react";
import axios from "axios";
import { authService } from "@/services/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearForceExit,
  setForceExit,
  updateAuthState,
} from "@/store/authSlice";

interface UseHeartbeatOptions {
  intervalMs?: number; // Custom interval (default: 2 minutes)
  forceExitCallback?: () => void; // Callback when force exit detected
}

/**
 * Hook untuk heartbeat monitoring user state
 * - Tracks is_active dan is_logout dari backend
 * - Detects force_exit dan locks UI immediately
 * - Bisa adjust interval untuk exam sessions (lebih sering)
 */
export function useHeartbeat(options: UseHeartbeatOptions = {}): void {
  const {
    intervalMs = 2 * 60 * 1000, // Default 2 minutes
    forceExitCallback,
  } = options;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dispatch = useAppDispatch();
  const { isAuthenticated, is_logout } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (intervalRef.current !== null) return;

    const ping = async () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("api_token");
      // No token – user is not logged in, skip silently.
      if (!token) return;

      // Don't run heartbeat if user is logged out or not authenticated
      if (!isAuthenticated || is_logout) return;

      try {
        const response = await authService.heartbeat();

        // Update auth state based on heartbeat response
        dispatch(
          updateAuthState({
            is_active: response.is_active,
            is_logout: response.is_logout,
          }),
        );

        // If account has been reactivated by proctor, clear force_exit flag
        if (response.is_active && !response.is_logout) {
          dispatch(clearForceExit());
          // Also clear from localStorage
          if (typeof window !== "undefined") {
            localStorage.removeItem("force_exit");
            localStorage.removeItem("force_exit_reason");
          }
        }

        // If force_exit is detected, lock the UI immediately
        if (response.force_exit) {
          dispatch(setForceExit());

          // Call callback if provided
          if (forceExitCallback) {
            forceExitCallback();
          }

          // Redirect to lockout page
          if (typeof window !== "undefined") {
            localStorage.setItem("force_exit", "true");
            localStorage.setItem("force_exit_reason", "heartbeat_detected");
            window.location.href = "/exam/locked";
          }
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Handle 401 - stop heartbeat, will be handled by API interceptor
          if (error.response?.status === 401) {
            if (intervalRef.current !== null) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }

          // Handle 403 with force_exit
          if (error.response?.status === 403) {
            const errorData = error.response.data as { force_exit?: boolean };
            if (errorData?.force_exit) {
              dispatch(setForceExit());
              if (forceExitCallback) {
                forceExitCallback();
              }
              if (typeof window !== "undefined") {
                localStorage.setItem("force_exit", "true");
                localStorage.setItem(
                  "force_exit_reason",
                  "heartbeat_403_error",
                );
                window.location.href = "/exam/locked";
              }
              return;
            }
          }
        }
        // Network errors or any other failure: ignore silently, heartbeat continues
      }
    };

    intervalRef.current = setInterval(ping, intervalMs);

    // Also run heartbeat immediately on mount to catch any state changes
    ping();

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, is_logout, dispatch, intervalMs, forceExitCallback]);
}
