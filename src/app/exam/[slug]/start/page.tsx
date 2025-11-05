'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LoadingExamScreen } from '@/components/exam/LoadingExamScreen';
import { ErrorExamScreen } from '@/components/exam/ErrorExamScreen';
import { ExamProgressHeader } from '@/components/exam/ExamProgressHeader';
import { ExamMainContent } from '@/components/exam/ExamMainContent';
import { ExamNavigationFooter } from '@/components/exam/ExamNavigationFooter';
import { ExamSubmitModal } from '@/components/exam/ExamSubmitModal';
import { useExamLogic } from '@/hooks/useExamLogic';
import { useAppDispatch } from '@/store/hooks';
import { resetExamState } from '@/store/examSlice';

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
          // retryFetchExam, // Not needed anymore - auto redirect instead
          goBackToExamList,
          isSubmitAllowed,
          // Auto-save status (per-answer)
          isSaving,
          lastSavedTime,
          saveError,
          // Restore status
          isRestoring,
          hasRestored,
          restoreError,
          restoreStats,
          // Periodic backup status (bulk save)
          isBackingUp,
          lastBackupTime,
          backupError,
          backupCount,
     } = useExamLogic();

     React.useEffect(() => {
          dispatch(resetExamState());
          localStorage.removeItem('exam_result');
     }, [dispatch]);

     // Auto-redirect ke dashboard jika exam ended atau session invalid
     React.useEffect(() => {
          if (isExamEnded) {
               // Clear session data
               localStorage.removeItem('session_token');
               localStorage.removeItem('session_id');
               localStorage.removeItem('exam_result');
               localStorage.removeItem('current_exam_slug');

               // Small delay untuk smoother UX
               const timer = setTimeout(() => {
                    router.push('/dashboard');
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

     // ❌ REMOVE ERROR MODAL - Langsung redirect ke dashboard
     // Jika error dan exam ended, akan di-handle oleh useEffect di atas
     // Hanya tampilkan error jika BUKAN session invalid (isExamEnded = false)
     if ((isError || (!questions.length && !isLoading)) && !isExamEnded) {
          // Don't show error screen, just loading while redirecting
          return <LoadingExamScreen />;
     }

     return (
          <ProtectedRoute>
               <div className="min-h-screen bg-gray-50">
                    <ExamProgressHeader
                         onTimeUp={handleTimeUp}
                         onTimeUpdate={handleTimeUpdate}
                         // Auto-save status
                         isSaving={isSaving}
                         lastSavedTime={lastSavedTime}
                         saveError={saveError}
                         // Restore status
                         isRestoring={isRestoring}
                         hasRestored={hasRestored}
                         restoreError={restoreError}
                         restoreStats={restoreStats}
                         // Periodic backup status
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

               {/* Submit notification when available */}
               {/* {isSubmitAllowed && (
                    <div className='fixed bg-green-50 border border-green-200 p-4 rounded-lg shadow-lg top-20 right-4 z-50 max-w-sm'>
                         <div className="flex items-center gap-2 text-green-800">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <h3 className="font-medium">Tombol Submit Tersedia!</h3>
                         </div>
                         <p className="text-sm text-green-700 mt-1">
                              Anda sudah dapat menyelesaikan ujian sekarang.
                         </p>
                    </div>
               )} */}

          </ProtectedRoute>
     );
}