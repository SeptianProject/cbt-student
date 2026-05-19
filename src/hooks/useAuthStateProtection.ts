"use client";

import { useAppSelector } from "@/store/hooks";

export type AccessLevel = "exam" | "lockout" | "completed" | "unauthorized";

interface AuthStateProtectionResult {
  accessLevel: AccessLevel;
  is_active: boolean;
  is_logout: boolean;
  force_exit: boolean;
  canAccessExam: boolean;
  shouldShowLockout: boolean;
  shouldShowCompleted: boolean;
}

/**
 * Determines user's access level based on is_active and is_logout state
 * - is_active = true, is_logout = false: Can access exam (accessLevel = 'exam')
 * - is_active = false, is_logout = false: Show lockout page (accessLevel = 'lockout')
 * - is_active = false, is_logout = true: Show completed page (accessLevel = 'completed')
 * - Unauthorized for any other state
 */
export function useAuthStateProtection(): AuthStateProtectionResult {
  const { is_active, is_logout, force_exit } = useAppSelector(
    (state) => state.auth,
  );

  let accessLevel: AccessLevel;
  let canAccessExam = false;
  let shouldShowLockout = false;
  let shouldShowCompleted = false;

  if (force_exit) {
    // Force exit takes priority - show lockout
    accessLevel = "lockout";
    shouldShowLockout = true;
  } else if (is_active && !is_logout) {
    // Active and not logged out - can access exam
    accessLevel = "exam";
    canAccessExam = true;
  } else if (!is_active && !is_logout) {
    // Inactive but not logged out - lockout state (waiting for reactivation)
    accessLevel = "lockout";
    shouldShowLockout = true;
  } else if (!is_active && is_logout) {
    // Inactive and logged out - exam completed
    accessLevel = "completed";
    shouldShowCompleted = true;
  } else {
    // Unauthorized state
    accessLevel = "unauthorized";
  }

  return {
    accessLevel,
    is_active,
    is_logout,
    force_exit,
    canAccessExam,
    shouldShowLockout,
    shouldShowCompleted,
  };
}
