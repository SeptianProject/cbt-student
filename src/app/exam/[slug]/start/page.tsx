"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoadingExamScreen } from "@/components/exam/LoadingExamScreen";
import { ErrorExamScreen } from "@/components/exam/ErrorExamScreen";
import { ExamProgressHeader } from "@/components/exam/ExamProgressHeader";
import { ExamMainContent } from "@/components/exam/ExamMainContent";
import { ExamNavigationFooter } from "@/components/exam/ExamNavigationFooter";
import { ExamSubmitModal } from "@/components/exam/ExamSubmitModal";
import { useExamLogic } from "@/hooks/useExamLogic";
import { useAppDispatch } from "@/store/hooks";
import { resetExamState } from "@/store/examSlice";

export default function ExamStartPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const {
    userData,
    currentExam,
    questions,
    isLoading,
    isError,
    isExamEnded,
    currentQuestionIndex,
    currentQuestion,
    isFirstQuestion,
    isLastQuestion,
    slug,
    handleAnswerChange,
    handleFlagToggle,
    goToQuestion,
    goToPrevious,
    goToNext,
    handleSubmitExam,
    handleTimeUp,
    handleTimeUpdate,
    confirmSubmission,
    goBackToExamList,
    isSubmitAllowed,
    isSaving,
    lastSavedTime,
    saveError,
    isRestoring,
    hasRestored,
    restoreError,
    restoreStats,
    isBackingUp,
    lastBackupTime,
    backupError,
    backupCount,
  } = useExamLogic();

  React.useEffect(() => {
    dispatch(resetExamState());
    localStorage.removeItem("exam_result");
  }, [dispatch]);

  React.useEffect(() => {
    if (isExamEnded) {
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_id");
      localStorage.removeItem("exam_result");
      localStorage.removeItem("current_exam_slug");

      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 300);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExamEnded]);

  if (!userData || !currentExam || isLoading || isExamEnded) {
    return <LoadingExamScreen />;
  }

  if (userData?.assigned && !currentExam) {
    return (
      <ErrorExamScreen
        title="Ujian Tidak Ditemukan"
        message={`Ujian dengan slug "${slug}" tidak ditemukan. Silakan kembali ke halaman ujian.`}
        onRetry={goBackToExamList}
        retryButtonText="Kembali ke Ujian"
      />
    );
  }

  if ((isError || (!questions.length && !isLoading)) && !isExamEnded) {
    return <LoadingExamScreen />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <ExamProgressHeader
          onTimeUp={handleTimeUp}
          onTimeUpdate={handleTimeUpdate}
          isSaving={isSaving}
          lastSavedTime={lastSavedTime}
          saveError={saveError}
          isRestoring={isRestoring}
          hasRestored={hasRestored}
          restoreError={restoreError}
          restoreStats={restoreStats}
          isBackingUp={isBackingUp}
          lastBackupTime={lastBackupTime}
          backupError={backupError}
          backupCount={backupCount}
        />

        <ExamMainContent
          currentQuestionIndex={currentQuestionIndex}
          currentQuestion={currentQuestion}
          onAnswerChange={handleAnswerChange}
          onFlagToggle={handleFlagToggle}
          onQuestionSelect={goToQuestion}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onSubmit={handleSubmitExam}
          isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion}
          isSubmitAllowed={isSubmitAllowed}
        />
      </div>

      <ExamNavigationFooter
        onPrevious={goToPrevious}
        onNext={goToNext}
        onSubmit={handleSubmitExam}
        isFirstQuestion={isFirstQuestion}
        isLastQuestion={isLastQuestion}
        isSubmitAllowed={isSubmitAllowed}
      />

      <ExamSubmitModal onConfirmSubmit={confirmSubmission} />
    </ProtectedRoute>
  );
}
