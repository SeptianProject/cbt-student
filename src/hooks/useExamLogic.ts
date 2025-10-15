'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchExam, setAnswers, setFlag, setShowSubmitModal, submitExam, resetExamState } from '@/store/examSlice';
import { getCurrentUser } from '@/store/authSlice';
import { validateAnswers } from '@/lib/examUtils';
import { useAutoSaveAnswer } from './useAutoSaveAnswer';

export const useExamLogic = () => {
     const router = useRouter();
     const params = useParams();
     const slug = params.slug as string;
     const dispatch = useAppDispatch();

     const { dashboardData: userData } = useAppSelector((state) => state.auth);
     const {
          currentExam,
          questions,
          answers,
          isLoading,
          isError,
          examDuration,
          showSubmitModal,
          isExamEnded,
          isSubmitting,
          sessionId,
          sessionStatus,
     } = useAppSelector((state) => state.exam);

     const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
     const [isSubmitAllowed, setIsSubmitAllowed] = useState(false);

     // Auto-save answers
     useAutoSaveAnswer({
          sessionId,
          answers,
          questions,
          enabled: sessionStatus === 'progress' && !isExamEnded,
          debounceMs: 1500
     });

     // Reset exam state when slug changes (navigating between exams)
     useEffect(() => {
          dispatch(resetExamState());
     }, [slug, dispatch]);

     // Fetch user and exam data on mount
     useEffect(() => {
          dispatch(getCurrentUser());
     }, [dispatch]);

     useEffect(() => {
          if (userData?.assigned && slug && userData.student?.id) {
               dispatch(fetchExam({ assigned: userData.assigned, slug, userId: userData.student.id }));
          }
     }, [userData, slug, dispatch]);

     // Navigate to dashboard when exam ends (skip complete page)
     useEffect(() => {
          if (isExamEnded && !isSubmitting) {
               setTimeout(() => {
                    // Clear current exam data
                    localStorage.removeItem('session_token');
                    localStorage.removeItem('session_id');
                    localStorage.removeItem('exam_result');
                    localStorage.removeItem('current_exam_slug');

                    // Navigate to dashboard
                    router.push('/dashboard');
               }, 500);
          }
     }, [isExamEnded, isSubmitting, router]);

     // Check if submit is allowed (15 minutes before exam ends)
     useEffect(() => {
          const fifteenMinutesInSeconds = 15 * 60; // 15 menit = 900 detik
          setIsSubmitAllowed(examDuration <= fifteenMinutesInSeconds);
     }, [examDuration]);

     // Prevent page unload during exam
     useEffect(() => {
          const handleBeforeUnload = (e: BeforeUnloadEvent) => {
               if (!isExamEnded) {
                    e.preventDefault();
                    e.returnValue = 'Anda sedang mengerjakan ujian. Yakin ingin meninggalkan halaman?';
               }
          };
          window.addEventListener('beforeunload', handleBeforeUnload);
          return () => window.removeEventListener('beforeunload', handleBeforeUnload);
     }, [isExamEnded]);

     // Answer and flag handlers
     const handleAnswerChange = useCallback((questionId: number, answer: string | string[]) => {
          dispatch(setAnswers({ questionId, answer }));
     }, [dispatch]);

     const handleFlagToggle = useCallback((questionId: number, isFlagged: boolean) => {
          dispatch(setFlag({ questionId, isFlagged }));
     }, [dispatch]);

     // Navigation handlers
     const goToQuestion = useCallback((questionNumber: number) => {
          setCurrentQuestionIndex(questionNumber - 1);
     }, []);

     const goToPrevious = useCallback(() => {
          if (currentQuestionIndex > 0) {
               setCurrentQuestionIndex((prev) => prev - 1);
          }
     }, [currentQuestionIndex]);

     const goToNext = useCallback(() => {
          if (currentQuestionIndex < questions.length - 1) {
               setCurrentQuestionIndex((prev) => prev + 1);
          }
     }, [currentQuestionIndex, questions.length]);

     // Submit handlers
     const handleSubmitExam = useCallback(() => {
          // Check if submit is allowed (15 minutes before exam ends)
          if (!isSubmitAllowed) {
               return; // Don't allow submit if not in the 15-minute window
          }

          const validation = validateAnswers(answers, questions);
          if (validation.warnings.length > 0) {
               dispatch(setShowSubmitModal(true));
          } else {
               if (currentExam?.exam_id) {
                    dispatch(submitExam({
                         examId: currentExam.exam_id,
                         answers,
                         questions,
                         finalSubmit: true
                    }));
               }
          }
     }, [answers, questions, dispatch, currentExam, isSubmitAllowed]);

     const handleTimeUp = useCallback(() => {
          if (!isExamEnded && currentExam?.exam_id) {
               // Force submit when time is up
               dispatch(submitExam({
                    examId: currentExam.exam_id,
                    answers,
                    questions,
                    forceSubmit: true,
                    finalSubmit: true
               }));
          }
     }, [isExamEnded, currentExam, answers, questions, dispatch]);

     const confirmSubmission = useCallback(() => {
          dispatch(setShowSubmitModal(false));
          if (currentExam?.exam_id) {
               dispatch(submitExam({
                    examId: currentExam.exam_id,
                    answers,
                    questions,
                    finalSubmit: true
               }));
          }
     }, [dispatch, currentExam, answers, questions]);

     // Retry handlers
     const retryFetchExam = useCallback(() => {
          if (userData?.assigned && userData.student?.id) {
               dispatch(fetchExam({ assigned: userData.assigned, slug, userId: userData.student.id }));
          }
     }, [userData, slug, dispatch]);

     const goBackToExamList = useCallback(() => {
          router.push('/exam');
     }, [router]);

     // Computed values
     const currentQuestion = questions[currentQuestionIndex];
     const isFirstQuestion = currentQuestionIndex === 0;
     const isLastQuestion = currentQuestionIndex === questions.length - 1;

     const closeSessionExpiredModal = useCallback(() => {
          // Session expired modal is disabled for now
          router.push('/dashboard');
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

          // Handlers
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
          closeSessionExpiredModal,
     };
};
