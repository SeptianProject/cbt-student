"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { useLogoutForceExit } from "@/hooks/useLogoutForceExit";
import { examService } from "@/services/exam";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  forceDuringExam?: boolean; // If true, trigger force exit when in exam
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = "outline",
  size = "default",
  className = "",
  showIcon = true,
  showText = true,
  forceDuringExam = true,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { handleLogoutDuringExam, handleLogoutNormal } = useLogoutForceExit();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      // Check if there's an active exam session
      const sessionToken =
        typeof window !== "undefined"
          ? localStorage.getItem("session_token")
          : null;
      const examId =
        typeof window !== "undefined" ? localStorage.getItem("exam_id") : null;

      // Clear exam sessions first
      await examService.clearAllExamSessions();

      // If there's an active session and forceDuringExam is true, handle as force exit
      if (sessionToken && examId && forceDuringExam) {
        await handleLogoutDuringExam();
      } else {
        // Normal logout
        try {
          await dispatch(logout()).unwrap();
        } catch (error) {
          console.warn(
            "Redux logout failed, continuing with normal logout",
            error,
          );
        }
        await handleLogoutNormal();
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: clear all and redirect
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}>
      {showIcon && <LogOut className={`${showText ? "mr-2" : ""} w-4 h-4`} />}
      {showText && (isLoggingOut ? "Keluar..." : "Keluar")}
    </Button>
  );
};
