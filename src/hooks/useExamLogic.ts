"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchExam,
  primeExamSession,
  setAnswers,
  setFlag,
  setShowSubmitModal,
  submitExam,
  resetExamState,
  setTimeRemaining,
} from "@/store/examSlice";
import { getCurrentUser } from "@/store/authSlice";
import {
  validateAnswers,
  areAllQuestionsAnswered,
  findExamBySlug,
} from "@/lib/examUtils";
import { useAutoSaveAnswer } from "./useAutoSaveAnswer";
import { useRestoreAnswers } from "./useRestoreAnswers";
import { usePeriodicBackup } from "./usePeriodicBackup";
import { useEnsureSessionId } from "./useEnsureSessionId";
import { useTimerPersistence } from "./useTimerPersistence";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Helper function untuk smooth scroll ke atas halaman
 * Menggunakan requestAnimationFrame untuk performa optimal
 */
const scrollToTop = () => {
  // Gunakan requestAnimationFrame untuk performa yang lebih baik
  requestAnimationFrame(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
};

export const useExamLogic = () => {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { dashboardData: userData } = useAppSelector((state) => state.auth);
  const {
    currentExam,
    questions,
    answers,
    isLoading,
    isError,
    examDuration,
    timeRemaining,
    showSubmitModal,
    isExamEnded,
    isSubmitting,
    sessionId,
    sessionStatus,
  } = useAppSelector((state) => state.exam);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitAllowed, setIsSubmitAllowed] = useState(false);

  // Ensure session ID is always available
  useEnsureSessionId();

  // Timer persistence - calculate remaining time from localStorage
  const { calculateRemainingTime, clearTimer } = useTimerPersistence({
    examId: currentExam?.exam_id,
    duration: examDuration,
    enabled: sessionStatus === "progress" && !isExamEnded,
  });

  // Restore answers from temporary table after refresh/reconnect
  const { isRestoring, hasRestored, restoreError, restoreStats } =
    useRestoreAnswers({
      sessionId,
      enabled: sessionStatus === "progress" && !isExamEnded,
    });

  // Sync timer from localStorage after restore
  useEffect(() => {
    if (hasRestored && currentExam?.exam_id && sessionStatus === "progress") {
      const persistedTime = calculateRemainingTime();

      // Update Redux state with persisted time if different
      if (persistedTime !== timeRemaining && persistedTime > 0) {
        dispatch(setTimeRemaining(persistedTime));
      }
    }
  }, [
    hasRestored,
    currentExam?.exam_id,
    sessionStatus,
    calculateRemainingTime,
    timeRemaining,
    dispatch,
  ]);

  // Auto-save answers with status tracking (individual answer save)
  const { isSaving, lastSavedTime, saveError } = useAutoSaveAnswer({
    sessionId,
    answers,
    questions,
    enabled: sessionStatus === "progress" && !isExamEnded && hasRestored, // Only auto-save after restore
    debounceMs: 500, // Faster debounce for better UX
  });

  // Periodic backup (bulk save every 2 minutes)
  const { isBackingUp, lastBackupTime, backupError, backupCount } =
    usePeriodicBackup({
      sessionId,
      answers,
      questions,
      enabled: sessionStatus === "progress" && !isExamEnded && hasRestored, // Only backup after restore
      intervalMs: 2 * 60 * 1000, // 2 minutes
    });

  // Reset exam state when slug changes (navigating between exams)
  useEffect(() => {
    dispatch(resetExamState());
    // Invalidate and refetch user data to get latest assigned exams
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    dispatch(getCurrentUser()); // Also update Redux store
  }, [slug, dispatch, queryClient]);

  useEffect(() => {
    if (!userData?.assigned || !slug) {
      return;
    }

    const currentExamFromAssigned = findExamBySlug(userData.assigned, slug);
    if (!currentExamFromAssigned) {
      return;
    }

    const hasActiveSession =
      typeof window !== "undefined" &&
      Boolean(localStorage.getItem("session_token")) &&
      Boolean(localStorage.getItem("session_id"));

    dispatch(
      primeExamSession({
        currentExam: currentExamFromAssigned,
        sessionStatus: hasActiveSession ? "progress" : null,
      }),
    );
  }, [userData?.assigned, slug, dispatch]);

  useEffect(() => {
    if (userData?.assigned && slug && userData.student?.id) {
      dispatch(
        fetchExam({
          assigned: userData.assigned,
          slug,
          userId: userData.student.id,
        }),
      );
    }
  }, [userData, slug, dispatch]);

  // Navigate to dashboard when exam ends (skip complete page)
  useEffect(() => {
    if (isExamEnded && !isSubmitting) {
      // Clear timer persistence
      clearTimer();

      // Invalidate currentUser query to fetch fresh data (updated assigned exams)
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Also refetch to ensure fresh data immediately
      queryClient.refetchQueries({ queryKey: ["currentUser"] });

      setTimeout(() => {
        // Clear current exam data
        localStorage.removeItem("session_token");
        localStorage.removeItem("session_id");
        localStorage.removeItem("exam_result");
        localStorage.removeItem("current_exam_slug");

        // Navigate to dashboard
        router.push("/dashboard");
      }, 500);
    }
  }, [isExamEnded, isSubmitting, router, queryClient, clearTimer]);

  // Check if submit is allowed (all questions answered)
  // Submit button akan aktif jika semua soal sudah dijawab
  useEffect(() => {
    const allAnswered = areAllQuestionsAnswered(answers, questions);
    setIsSubmitAllowed(allAnswered);
  }, [answers, questions]);

  // Prevent page unload during exam
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isExamEnded) {
        e.preventDefault();
        e.returnValue =
          "Anda sedang mengerjakan ujian. Yakin ingin meninggalkan halaman?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isExamEnded]);

  // Answer and flag handlers
  const handleAnswerChange = useCallback(
    (questionId: number, answer: string | string[]) => {
      dispatch(setAnswers({ questionId, answer }));
    },
    [dispatch],
  );

  const handleFlagToggle = useCallback(
    (questionId: number, isFlagged: boolean) => {
      dispatch(setFlag({ questionId, isFlagged }));
    },
    [dispatch],
  );

  // Navigation handlers
  const goToQuestion = useCallback((questionNumber: number) => {
    setCurrentQuestionIndex(questionNumber - 1);
    scrollToTop(); // Auto-scroll ke atas untuk fokus membaca soal
  }, []);

  const goToPrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      scrollToTop(); // Auto-scroll ke atas untuk fokus membaca soal
    }
  }, [currentQuestionIndex]);

  const goToNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      scrollToTop(); // Auto-scroll ke atas untuk fokus membaca soal
    }
  }, [currentQuestionIndex, questions.length]);

  // Submit handlers
  const handleSubmitExam = useCallback(() => {
    // Check if submit is allowed (all questions must be answered)
    if (!isSubmitAllowed) {
      return; // Don't allow submit if not all questions are answered
    }

    const validation = validateAnswers(answers, questions);
    if (validation.warnings.length > 0) {
      dispatch(setShowSubmitModal(true));
    } else {
      if (currentExam?.exam_id) {
        dispatch(
          submitExam({
            examId: currentExam.exam_id,
            answers,
            questions,
            finalSubmit: true,
          }),
        );
      }
    }
  }, [answers, questions, dispatch, currentExam, isSubmitAllowed]);

  const handleTimeUp = useCallback(() => {
    if (!isExamEnded && currentExam?.exam_id) {
      // Force submit when time is up
      dispatch(
        submitExam({
          examId: currentExam.exam_id,
          answers,
          questions,
          forceSubmit: true,
          finalSubmit: true,
        }),
      );
    }
  }, [isExamEnded, currentExam, answers, questions, dispatch]);

  // Handler untuk update waktu tersisa
  const handleTimeUpdate = useCallback(
    (newTimeRemaining: number) => {
      dispatch(setTimeRemaining(newTimeRemaining));
    },
    [dispatch],
  );

  const confirmSubmission = useCallback(() => {
    // ✅ Don't close modal here - let it stay open during submission
    // Modal will auto-close when submission completes or user is redirected
    if (currentExam?.exam_id) {
      dispatch(
        submitExam({
          examId: currentExam.exam_id,
          answers,
          questions,
          finalSubmit: true,
        }),
      );
    }
  }, [dispatch, currentExam, answers, questions]);

  // Retry handlers
  const retryFetchExam = useCallback(() => {
    if (userData?.assigned && userData.student?.id) {
      dispatch(
        fetchExam({
          assigned: userData.assigned,
          slug,
          userId: userData.student.id,
        }),
      );
    }
  }, [userData, slug, dispatch]);

  const goBackToExamList = useCallback(() => {
    router.push("/exam");
  }, [router]);

  // Computed values
  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const closeSessionExpiredModal = useCallback(() => {
    // Session expired modal is disabled for now
    router.push("/dashboard");
  }, [router]);

  return {
    // State
    userData,
    currentExam,
    questions,
    answers,
    isLoading,
    isError,
    examDuration,
    showSubmitModal,
    isExamEnded,
    isSubmitting,
    currentQuestionIndex,
    currentQuestion,
    isFirstQuestion,
    isLastQuestion,
    slug,
    showSessionExpired: false, // Always false for now
    isSessionValid: true, // Always true for now (no session monitoring)
    isSubmitAllowed,
    // Auto-save status
    isSaving,
    lastSavedTime,
    saveError,
    // Restore status
    isRestoring,
    hasRestored,
    restoreError,
    restoreStats,
    // Periodic backup status
    isBackingUp,
    lastBackupTime,
    backupError,
    backupCount,

    // Handlers
    handleAnswerChange,
    handleFlagToggle,
    goToQuestion,
    goToPrevious,
    goToNext,
    handleSubmitExam,
    handleTimeUp,
    handleTimeUpdate,
    confirmSubmission,
    retryFetchExam,
    goBackToExamList,
    closeSessionExpiredModal,
  };
};
