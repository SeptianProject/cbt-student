'use client';

import { useEffect, useRef, useCallback } from 'react';
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
     debounceMs = 1000
}: UseAutoSaveAnswerOptions) => {
     const previousAnswersRef = useRef<Record<number, StudentAnswer>>({});
     const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
     const isSavingRef = useRef(false);

     const saveAnswer = useCallback(async (questionId: number, answer: StudentAnswer) => {
          if (!sessionId || !enabled || isSavingRef.current) return;

          const question = questions.find(q => q.id === questionId);
          if (!question) return;

          // Skip if answer is empty
          if (!answer.answer || answer.answer === '' ||
               (Array.isArray(answer.answer) && answer.answer.length === 0)) {
               return;
          }

          try {
               isSavingRef.current = true;

               // Determine answer type based on question type
               // "0": Multiple Choice, "1": Multiple Choice Complex, "2": True/False, "3": Essay
               const answerType = question.question_type_id === "3" ? 'essay' : 'choice';

               await examService.updateAnswer(
                    sessionId,
                    questionId,
                    answer.answer,
                    answerType
               );

               console.log('Answer auto-saved:', { questionId, type: answerType });
          } catch (error) {
               console.error('Failed to auto-save answer:', error);
          } finally {
               isSavingRef.current = false;
          }
     }, [sessionId, questions, enabled]);

     useEffect(() => {
          if (!enabled || !sessionId) return;

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
          isSaving: isSavingRef.current
     };
};
