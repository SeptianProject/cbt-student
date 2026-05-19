"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAuthStateProtection } from "@/hooks/useAuthStateProtection";
import { useForceExitDetection } from "@/hooks/useForceExitDetection";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireExamAccess?: boolean; // If true, only allow access if canAccessExam is true
}

export default function ProtectedRoute({
  children,
  requireExamAccess = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isUnauthenticated } = useAuth();
  const { canAccessExam, shouldShowLockout, shouldShowCompleted, accessLevel } =
    useAuthStateProtection();
  const { isForceExited, forceExitReason } = useForceExitDetection();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isUnauthenticated) {
      router.push("/");
    }
  }, [mounted, isUnauthenticated, router]);

  // Enforce state protection if this is an exam page
  useEffect(() => {
    if (mounted && isAuthenticated && requireExamAccess) {
      // Force exit takes priority - redirect to locked page
      if (isForceExited) {
        router.push("/exam/locked");
      } else if (shouldShowLockout) {
        router.push("/exam/locked");
      } else if (shouldShowCompleted) {
        router.push("/dashboard");
      }
    }
  }, [
    mounted,
    isAuthenticated,
    isForceExited,
    shouldShowLockout,
    shouldShowCompleted,
    requireExamAccess,
    router,
  ]);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isUnauthenticated) {
    return null;
  }

  // If this is an exam page and state protection is required
  if (requireExamAccess) {
    if (isForceExited) {
      // Force exit state - don't render content, let redirect happen
      return null;
    }

    if (!canAccessExam) {
      // Not authorized to access exam
      return null;
    }
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
}
