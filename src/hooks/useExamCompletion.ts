import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/store/hooks";
import { resetExamState } from "@/store/examSlice";
import { examService } from "@/services/exam";
import { createExamSlug } from "@/lib/examUtils";
import { useExamFlow } from "./useExamFlow";
import type { ExamSubmitResult, AssignedExam } from "@/types";

interface UseExamCompletionProps {
  completedExam: AssignedExam | null;
  allExams: AssignedExam[];
}

export const useExamCompletion = ({
  completedExam,
  allExams,
}: UseExamCompletionProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(5);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [examResult, setExamResult] = useState<ExamSubmitResult["data"] | null>(
    null,
  );
  const [isClient, setIsClient] = useState(false);
  const hasNavigatedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    findNextExam,
    areAllExamsCompleted,
    getExamProgress,
    updateExamStatus,
  } = useExamFlow();

  // Fix hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load exam result from localStorage
  useEffect(() => {
    if (!isClient) return;

    const storedResult = localStorage.getItem("exam_result");
    if (storedResult) {
      try {
        const result = JSON.parse(storedResult);
        setExamResult(result);
      } catch (error) {
        console.error("Failed to parse exam result:", error);
      }
    }

    // Mark current exam as completed
    if (completedExam) {
      updateExamStatus(completedExam.exam_id, "completed");
    }

    // Clean up localStorage
    localStorage.removeItem("current_exam_slug");
    localStorage.removeItem("session_token");
  }, [isClient, completedExam, updateExamStatus]);

  const nextExam = useCallback(() => {
    if (!isClient || !completedExam || !allExams.length) return null;
    return findNextExam(allExams, completedExam.exam_id);
  }, [isClient, completedExam, allExams, findNextExam]);

  const allCompleted = useCallback(() => {
    if (!isClient) return false;
    return areAllExamsCompleted(allExams);
  }, [isClient, allExams, areAllExamsCompleted]);

  const progress = useCallback(() => {
    if (!isClient)
      return { total: 0, completed: 0, inProgress: 0, notStarted: 0 };
    return getExamProgress(allExams);
  }, [isClient, allExams, getExamProgress]);

  const handleAutoNavigation = useCallback(async () => {
    if (hasNavigatedRef.current || !isClient) return;

    hasNavigatedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsTransitioning(true);

    setTimeout(async () => {
      const next = nextExam();
      const isAllCompleted = allCompleted();

      if (next && !isAllCompleted) {
        const nextExamSlug = createExamSlug(next.title);

        dispatch(resetExamState());

        queryClient.removeQueries({ queryKey: ["exam"] });
        queryClient.removeQueries({ queryKey: ["session"] });
        queryClient.removeQueries({ queryKey: ["examData"] });

        localStorage.removeItem("exam_result");
        localStorage.removeItem("session_token");
        localStorage.removeItem("session_id");

        localStorage.setItem("exam_id", next.exam_id.toString());
        localStorage.setItem("exam_duration", next.duration.toString());
        localStorage.setItem("current_exam_slug", nextExamSlug);

        router.push(`/exam/${nextExamSlug}`);
      } else {
        await examService.clearAllExamSessions();
        router.push("/dashboard");
      }
    }, 200);
  }, [nextExam, allCompleted, router, dispatch, queryClient, isClient]);

  // Setup countdown timer
  useEffect(() => {
    if (!isClient || hasNavigatedRef.current) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setTimeout(() => {
            handleAutoNavigation();
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      localStorage.removeItem("session_token");
    };
  }, [handleAutoNavigation, isClient]);

  const handleManualNavigation = useCallback(() => {
    if (hasNavigatedRef.current || !isClient) return;

    hasNavigatedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    handleAutoNavigation();
  }, [handleAutoNavigation, isClient]);

  const handleBackToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return {
    countdown,
    isTransitioning,
    examResult,
    isClient,
    nextExam: nextExam(),
    allCompleted: allCompleted(),
    progress: progress(),
    handleManualNavigation,
    handleBackToDashboard,
  };
};
