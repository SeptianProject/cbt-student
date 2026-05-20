"use client";

import { useEffect } from "react";

/**
 * Hook untuk sync auth state ketika exam selesai disubmit
 * Submit normal tidak mengubah auth state dari frontend.
 * Hook ini dipertahankan sebagai no-op untuk mencegah side effect lama.
 */
export function useSyncAuthStateOnExamEnd() {
  useEffect(() => {
    // Intentionally no-op.
  }, []);
}
