"use client";

import { useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { examService } from "@/services/exam";
import { ParsedQuestion, StudentAnswer } from "@/types";
import { ExamSubmitOptions } from "@/types";

/**
 * Hook untuk handle submit exam dengan cleanup state dan auth state update
 * Memastikan:
 * 1. Jawaban dikirim ke backend
 * 2. State UI dibersihkan
 * 3. Session dihapus dari localStorage
 * 4. User diarahkan ke hasil/dashboard oleh flow pemanggil
 */
export function useSubmitExamWithCleanup() {
  const { currentExam } = useAppSelector((state) => state.exam);

  const submitAndCleanup = useCallback(
    async (
      answers: Record<number, StudentAnswer>,
      questions: ParsedQuestion[],
      options: ExamSubmitOptions = {},
    ) => {
      if (!currentExam?.exam_id) {
        throw new Error("Exam ID is not available");
      }

      try {
        // Submit answers to backend
        const submitResponse = await examService.submitExam(
          currentExam.exam_id,
          answers,
          questions,
          options,
        );

        // Clear session data (already done in examService, but ensure it here too)
        if (typeof window !== "undefined") {
          localStorage.removeItem("session_token");
          localStorage.removeItem("session_id");
          localStorage.removeItem("exam_id");
          localStorage.removeItem("exam_duration");
          localStorage.removeItem(`exam_start_time_${currentExam.exam_id}`);
          localStorage.removeItem(`exam_duration_${currentExam.exam_id}`);
        }

        return submitResponse;
      } catch (error) {
        console.error("Error in submitAndCleanup:", error);
        throw error;
      }
    },
    [currentExam],
  );

  return { submitAndCleanup };
}
