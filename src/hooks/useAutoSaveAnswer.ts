'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { examService } from '@/services/exam';
import { StudentAnswer, ParsedQuestion } from '@/types';

interface UseAutoSaveAnswerOptions {
     sessionId: number | null;
     answers: Record<number, StudentAnswer>;
     questions: ParsedQuestion[];
     enabled?: boolean;
     debounceMs?: number;
}

export const useAutoSaveAnswer = ({
     sessionId,
     answers,
     questions,
     enabled = true,
     debounceMs = 500 // Reduced to 500ms for faster saves
}: UseAutoSaveAnswerOptions) => {
     const previousAnswersRef = useRef<Record<number, StudentAnswer>>({});
     const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
     const savingQuestionsRef = useRef<Set<number>>(new Set());
     const [isSaving, setIsSaving] = useState(false);
     const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
     const [saveError, setSaveError] = useState<string | null>(null);

     const saveAnswer = useCallback(async (questionId: number, answer: StudentAnswer) => {
          if (!sessionId || !enabled) {
               return;
          }

          const question = questions.find(q => q.id === questionId);
          if (!question) {
               return;
          }

          // Skip if answer is empty
          if (!answer.answer || answer.answer === '' ||
               (Array.isArray(answer.answer) && answer.answer.length === 0)) {
               return;
          }

          // Skip if already saving this question
          if (savingQuestionsRef.current.has(questionId)) {
               return;
          }

          try {
               savingQuestionsRef.current.add(questionId);
               setIsSaving(true);
               setSaveError(null);

               // Determine answer type based on question type
               // "0": Multiple Choice, "1": Multiple Choice Complex, "2": True/False, "3": Essay
               const answerType = question.question_type_id === "3" ? 'essay' : 'choice';

               await examService.updateAnswer(
                    sessionId,
                    questionId,
                    answer.answer,
                    answerType
               );

               setLastSavedTime(new Date());
          } catch (error) {
               console.error('❌ Failed to save answer:', error);
               const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan jawaban';
               setSaveError(errorMessage);

               // Log detailed error
               if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { status?: number; data?: unknown } };
                    console.error('Error details:', {
                         status: axiosError.response?.status,
                         data: axiosError.response?.data,
                         sessionId,
                         questionId
                    });
               }

               // Optional: Retry logic bisa ditambahkan di sini jika diperlukan
               // setTimeout(() => saveAnswer(questionId, answer), 2000);
          } finally {
               savingQuestionsRef.current.delete(questionId);
               setIsSaving(savingQuestionsRef.current.size > 0);
          }
     }, [sessionId, questions, enabled]);

     useEffect(() => {
          if (!enabled || !sessionId) {
               return;
          }

          // Find changed answers
          const changedAnswers: Array<{ questionId: number; answer: StudentAnswer }> = [];

          Object.entries(answers).forEach(([questionIdStr, answer]) => {
               const questionId = parseInt(questionIdStr);
               const previousAnswer = previousAnswersRef.current[questionId];

               // Check if answer has changed
               const hasChanged = !previousAnswer ||
                    JSON.stringify(previousAnswer.answer) !== JSON.stringify(answer.answer);

               if (hasChanged && answer.answer && answer.answer !== '' &&
                    !(Array.isArray(answer.answer) && answer.answer.length === 0)) {
                    changedAnswers.push({ questionId, answer });
               }
          });

          if (changedAnswers.length > 0) {
               // Clear previous timeout
               if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
               }

               // Set new timeout for debounced save
               saveTimeoutRef.current = setTimeout(() => {
                    // Save all changed answers sequentially to avoid race conditions
                    changedAnswers.forEach(({ questionId, answer }) => {
                         saveAnswer(questionId, answer);
                    });
               }, debounceMs);
          }

          // Update previous answers ref
          previousAnswersRef.current = { ...answers };

          return () => {
               if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
               }
          };
     }, [answers, saveAnswer, enabled, sessionId, debounceMs]);

     return {
          isSaving,
          lastSavedTime,
          saveError
     };
};
