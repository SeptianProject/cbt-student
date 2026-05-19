"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateAuthState } from "@/store/authSlice";

/**
 * Hook untuk sync auth state ketika exam selesai disubmit
 * Memastikan is_active=false dan is_logout=true setelah submission
 */
export function useSyncAuthStateOnExamEnd() {
  const dispatch = useAppDispatch();
  const { isExamEnded, sessionStatus } = useAppSelector((state) => state.exam);

  useEffect(() => {
    // Ketika exam sudah selesai disubmit, update auth state
    if (isExamEnded && sessionStatus === "submited") {
      dispatch(
        updateAuthState({
          is_active: false,
          is_logout: true,
        }),
      );
    }
  }, [isExamEnded, sessionStatus, dispatch]);
}
