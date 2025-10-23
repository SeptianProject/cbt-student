'use client';

import { useAppSelector } from '@/store/hooks';
import { StudentAnswer } from '@/types';
import { useMemo } from 'react';

/**
 * Hook untuk mengelola randomized questions dan mapping
 */
export const useRandomizedQuestions = () => {
     const { questions, originalQuestions, randomizationData } = useAppSelector((state) => state.exam);

     // Get mapping functions
     const mappingUtils = useMemo(() => {
          if (!randomizationData) {
               return {
                    getRandomizedIndex: (originalIndex: number) => originalIndex,
                    getOriginalIndex: (randomizedIndex: number) => randomizedIndex,
                    getQuestionByOriginalIndex: (originalIndex: number) => originalQuestions[originalIndex],
                    getQuestionByRandomizedIndex: (randomizedIndex: number) => questions[randomizedIndex],
                    isRandomized: false
               };
          }

          return {
               getRandomizedIndex: (originalIndex: number) => {
                    return randomizationData.originalToRandomizedMap[originalIndex] ?? originalIndex;
               },
               getOriginalIndex: (randomizedIndex: number) => {
                    return randomizationData.randomizedToOriginalMap[randomizedIndex] ?? randomizedIndex;
               },
               getQuestionByOriginalIndex: (originalIndex: number) => {
                    const randomizedIndex = randomizationData.originalToRandomizedMap[originalIndex];
                    return randomizedIndex !== undefined ? questions[randomizedIndex] : originalQuestions[originalIndex];
               },
               getQuestionByRandomizedIndex: (randomizedIndex: number) => {
                    return questions[randomizedIndex];
               },
               isRandomized: true
          };
     }, [questions, originalQuestions, randomizationData]);

     // Navigation utilities that work with randomized questions
     const navigationUtils = useMemo(() => ({
          // Get question status by question number (1-based)
          getQuestionStatus: (questionNumber: number, answers: Record<number, StudentAnswer>) => {
               const questionIndex = questionNumber - 1;
               const question = questions[questionIndex];
               if (!question) return 'unanswered';

               const answer = answers[question.id];
               if (!answer) return 'unanswered';

               if (answer.is_flagged) return 'flagged';

               if (Array.isArray(answer.answer)) {
                    return answer.answer.length > 0 ? 'answered' : 'unanswered';
               } else {
                    return answer.answer && answer.answer.toString().trim() !== '' ? 'answered' : 'unanswered';
               }
          },

          // Find first unanswered question (returns 1-based question number)
          findFirstUnanswered: (answers: Record<number, StudentAnswer>) => {
               for (let i = 0; i < questions.length; i++) {
                    const question = questions[i];
                    if (!question) continue;

                    const answer = answers[question.id];
                    let isUnanswered = true;

                    if (answer) {
                         if (Array.isArray(answer.answer)) {
                              isUnanswered = answer.answer.length === 0;
                         } else {
                              isUnanswered = !answer.answer || answer.answer.toString().trim() === '';
                         }
                    }

                    if (isUnanswered) {
                         return i + 1; // Return 1-based question number
                    }
               }
               return null;
          },

          // Find first flagged question (returns 1-based question number)
          findFirstFlagged: (answers: Record<number, StudentAnswer>) => {
               for (let i = 0; i < questions.length; i++) {
                    const question = questions[i];
                    if (question && answers[question.id]?.is_flagged) {
                         return i + 1; // Return 1-based question number
                    }
               }
               return null;
          },

          // Get progress statistics
          getProgressStats: (answers: Record<number, StudentAnswer>) => {
               let answered = 0;
               let flagged = 0;
               let unanswered = 0;

               questions.forEach(question => {
                    const answer = answers[question.id];

                    if (!answer) {
                         unanswered++;
                         return;
                    }

                    if (answer.is_flagged) {
                         flagged++;
                    }

                    let hasAnswer = false;
                    if (Array.isArray(answer.answer)) {
                         hasAnswer = answer.answer.length > 0;
                    } else {
                         hasAnswer = !!(answer.answer && answer.answer.toString().trim() !== '');
                    }

                    if (hasAnswer) {
                         answered++;
                    } else {
                         unanswered++;
                    }
               });

               return {
                    answered,
                    flagged,
                    unanswered,
                    total: questions.length,
                    percentage: questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0
               };
          }
     }), [questions]);

     return {
          // Questions data
          questions,
          originalQuestions,

          // Mapping utilities
          ...mappingUtils,

          // Navigation utilities
          ...navigationUtils
     };
};
