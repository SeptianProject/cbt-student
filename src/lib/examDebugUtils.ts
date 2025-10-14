/**
 * Debug utility untuk troubleshoot masalah exam answers
 */

import { StudentAnswer } from '@/types';

export const examDebugUtils = {
     /**
      * Log semua answers untuk debugging
      */
     logAnswers: (answers: Record<number, StudentAnswer>, questionId?: number) => {
          if (process.env.NODE_ENV === 'development') {
               if (questionId) {
                    console.log(`[EXAM DEBUG] Answer untuk question ${questionId}:`, answers[questionId]);
               } else {
                    console.log('[EXAM DEBUG] Semua answers:', answers);
               }
          }
     },

     /**
      * Validate answer format
      */
     validateAnswerFormat: (questionId: number, answer: string | string[], questionType: string) => {
          const validationResult = {
               isValid: true,
               errors: [] as string[]
          };

          // Validasi berdasarkan tipe soal
          switch (questionType) {
               case '0': // Single Choice (Pilihan Ganda)
                    if (Array.isArray(answer)) {
                         if (answer.length > 1) {
                              validationResult.isValid = false;
                              validationResult.errors.push('Single choice tidak boleh lebih dari 1 jawaban');
                         }
                    }
                    break;

               case '1': // Multiple Choice Complex (Pilihan Ganda Kompleks)
                    if (!Array.isArray(answer)) {
                         validationResult.isValid = false;
                         validationResult.errors.push('Multiple choice complex harus berupa array');
                    }
                    break;

               case '2': // True/False (Benar Salah)
                    if (Array.isArray(answer)) {
                         if (answer.length > 1) {
                              validationResult.isValid = false;
                              validationResult.errors.push('True/False tidak boleh lebih dari 1 jawaban');
                         }
                    }
                    break;

               case '3': // Essay
                    if (typeof answer !== 'string') {
                         validationResult.isValid = false;
                         validationResult.errors.push('Essay answer harus berupa string');
                    }
                    break;
          }

          if (process.env.NODE_ENV === 'development' && !validationResult.isValid) {
               console.warn(`[EXAM DEBUG] Validation error untuk question ${questionId}:`, validationResult.errors);
          }

          return validationResult;
     },

     /**
      * Check for answer conflicts (sama antar questions)
      */
     checkAnswerConflicts: (answers: Record<number, StudentAnswer>) => {
          const conflicts: Array<{
               question1: string;
               question2: string;
               sameAnswer: string;
          }> = [];
          const answerValues = Object.entries(answers);

          for (let i = 0; i < answerValues.length; i++) {
               for (let j = i + 1; j < answerValues.length; j++) {
                    const [questionId1, answer1] = answerValues[i];
                    const [questionId2, answer2] = answerValues[j];

                    // Hanya check untuk multiple choice yang sama persis
                    if (typeof answer1.answer === 'string' &&
                         typeof answer2.answer === 'string' &&
                         answer1.answer === answer2.answer &&
                         answer1.answer !== '') {
                         conflicts.push({
                              question1: questionId1,
                              question2: questionId2,
                              sameAnswer: answer1.answer
                         });
                    }
               }
          }

          if (process.env.NODE_ENV === 'development' && conflicts.length > 0) {
               console.warn('[EXAM DEBUG] Potential answer conflicts detected:', conflicts);
          }

          return conflicts;
     },

     /**
      * Clear invalid answers
      */
     cleanAnswers: (answers: Record<number, StudentAnswer>): Record<number, StudentAnswer> => {
          const cleaned: Record<number, StudentAnswer> = {};

          Object.entries(answers).forEach(([questionId, answer]) => {
               // Skip empty atau invalid answers
               if (answer.answer !== '' && answer.answer !== null && answer.answer !== undefined) {
                    cleaned[parseInt(questionId)] = answer;
               }
          });

          return cleaned;
     },

     /**
      * Compare answers before and after changes
      */
     compareAnswers: (oldAnswers: Record<number, StudentAnswer>, newAnswers: Record<number, StudentAnswer>) => {
          const changes: Array<{
               questionId: number;
               oldAnswer: string | string[] | null;
               newAnswer: string | string[] | null;
               type: 'modified' | 'removed';
          }> = [];

          // Check for modified answers
          Object.keys(newAnswers).forEach(questionId => {
               const qId = parseInt(questionId);
               const oldAnswer = oldAnswers[qId];
               const newAnswer = newAnswers[qId];

               if (!oldAnswer || JSON.stringify(oldAnswer.answer) !== JSON.stringify(newAnswer.answer)) {
                    changes.push({
                         questionId: qId,
                         oldAnswer: oldAnswer?.answer || null,
                         newAnswer: newAnswer.answer,
                         type: 'modified'
                    });
               }
          });

          // Check for removed answers
          Object.keys(oldAnswers).forEach(questionId => {
               const qId = parseInt(questionId);
               if (!newAnswers[qId]) {
                    changes.push({
                         questionId: qId,
                         oldAnswer: oldAnswers[qId].answer,
                         newAnswer: null,
                         type: 'removed'
                    });
               }
          });

          if (process.env.NODE_ENV === 'development' && changes.length > 0) {
               console.log('[EXAM DEBUG] Answer changes detected:', changes);
          }

          return changes;
     }
};

// Hook untuk debugging dalam development
export const useExamDebug = () => {
     if (process.env.NODE_ENV === 'development') {
          return examDebugUtils;
     }

     // Return no-op functions in production
     return {
          logAnswers: () => { },
          validateAnswerFormat: () => ({ isValid: true, errors: [] }),
          checkAnswerConflicts: () => [],
          cleanAnswers: (answers: Record<number, StudentAnswer>) => answers,
          compareAnswers: () => []
     };
};
