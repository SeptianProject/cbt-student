"use client";

import { ReactNode } from "react";
import { useHeartbeat } from "@/hooks/useHeartbeat";

/**
 * Mounts the background heartbeat interval for the lifetime of the app.
 * Renders no UI – purely a side-effect carrier.
 */
export default function HeartbeatProvider({
  children,
}: {
  children: ReactNode;
}) {
  useHeartbeat();
  return <>{children}</>;
}
