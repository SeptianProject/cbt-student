"use client";

import { ReactNode } from "react";
import { useStateSynchronization } from "@/hooks/useStateSynchronization";

/**
 * Provider component untuk mengelola state synchronization antara frontend dan backend
 * Ensures UI state always matches backend state
 */
export default function StateSyncProvider({
  children,
}: {
  children: ReactNode;
}) {
  useStateSynchronization();
  return <>{children}</>;
}
