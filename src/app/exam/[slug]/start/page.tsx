'use client';

import React from 'react';
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
          confirmSubmission,
          retryFetchExam,
          goBackToExamList,
          examDuration,
          isSubmitAllowed,
     } = useExamLogic();

     React.useEffect(() => {
          dispatch(resetExamState());
          localStorage.removeItem('exam_result');
     }, [dispatch]);



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
          return (
               <ErrorExamScreen
                    title="Gagal Memuat Ujian"
                    message="Terjadi kesalahan saat memuat soal ujian. Silakan coba lagi."
                    onRetry={retryFetchExam}
               />
          );
     }

     return (
          <ProtectedRoute>
               <div className="min-h-screen bg-gray-50">
                    <ExamProgressHeader onTimeUp={handleTimeUp} />                    <ExamMainContent
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

               <ExamSubmitModal onConfirmSubmit={confirmSubmission} examDuration={examDuration} />

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