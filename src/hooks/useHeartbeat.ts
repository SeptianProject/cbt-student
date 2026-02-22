"use client";

import { useEffect, useRef } from "react";
import axios from "axios";
import { authService } from "@/services/auth";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

export function useHeartbeat(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current !== null) return;

    const ping = async () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("api_token");
      // No token – user is not logged in, skip silently.
      if (!token) return;

      try {
        await authService.heartbeat();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        // Network errors or any other failure: ignore silently.
      }
    };

    intervalRef.current = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}
