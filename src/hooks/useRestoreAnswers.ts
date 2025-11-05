'use client';

import { useEffect, useState } from 'react';
import { examService } from '@/services/exam';
import { useAppDispatch } from '@/store/hooks';
import { setAnswers } from '@/store/examSlice';

interface UseRestoreAnswersOptions {
     sessionId: number | null;
     enabled?: boolean;
}

interface RestoreStats {
     totalRestored: number;
     multipleChoiceCount: number;
     essayCount: number;
     lastAnsweredAt: string | null;
}

/**
 * Hook untuk restore jawaban dari temporary table setelah refresh browser
 * 
 * Cara Kerja:
 * 1. User mengerjakan exam
 * 2. Jawaban auto-save ke temporary table (useAutoSaveAnswer)
 * 3. Browser di-refresh (internet issue, accident, dll)
 * 4. Hook ini akan fetch semua jawaban yang sudah disimpan
 * 5. Restore ke Redux state secara otomatis
 * 6. UI pilihan jawaban akan ter-update otomatis karena connected ke Redux
 * 
 * Flow:
 * - Panggil GET /api/siswa/exam-session/{sessionId}/answers
 * - Parse response dan restore ke Redux store
 * - Component QuestionCard akan automatically update karena subscribe ke Redux
 */
export const useRestoreAnswers = ({ sessionId, enabled = true }: UseRestoreAnswersOptions) => {
     const dispatch = useAppDispatch();
     const [isRestoring, setIsRestoring] = useState(false);
     const [hasRestored, setHasRestored] = useState(false);
     const [restoreError, setRestoreError] = useState<string | null>(null);
     const [restoreStats, setRestoreStats] = useState<RestoreStats | null>(null);

     useEffect(() => {
          const restoreAnswers = async () => {
               // Skip if disabled, already restored, or no session ID
               if (!enabled || hasRestored || !sessionId) {
                    return;
               }

               setIsRestoring(true);
               setRestoreError(null);

               try {
                    const savedAnswers = await examService.getSavedAnswers(sessionId);

                    if (Object.keys(savedAnswers).length > 0) {
                         let multipleChoiceCount = 0;
                         let essayCount = 0;

                         // Restore each answer to Redux
                         // This will automatically update UI because QuestionCard subscribes to Redux
                         Object.entries(savedAnswers).forEach(([questionIdStr, answer]) => {
                              const questionId = parseInt(questionIdStr);

                              // Dispatch to Redux - UI will auto-update
                              dispatch(setAnswers({
                                   questionId,
                                   answer: answer.answer
                              }));

                              // Count answer types for stats
                              if (Array.isArray(answer.answer) && answer.answer.length > 0 &&
                                   typeof answer.answer[0] === 'string' && answer.answer[0].length > 10) {
                                   essayCount++;
                              } else {
                                   multipleChoiceCount++;
                              }
                         });

                         const stats: RestoreStats = {
                              totalRestored: Object.keys(savedAnswers).length,
                              multipleChoiceCount,
                              essayCount,
                              lastAnsweredAt: new Date().toISOString()
                         };

                         setRestoreStats(stats);
                    } else {
                         setRestoreStats({
                              totalRestored: 0,
                              multipleChoiceCount: 0,
                              essayCount: 0,
                              lastAnsweredAt: null
                         });
                    }

                    setHasRestored(true);
               } catch (error) {
                    console.error('❌ Failed to restore answers:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Gagal restore jawaban';
                    setRestoreError(errorMessage);
                    // Don't block exam - allow user to continue
                    setHasRestored(true);
               } finally {
                    setIsRestoring(false);
               }
          };

          restoreAnswers();
     }, [sessionId, enabled, hasRestored, dispatch]); return {
          isRestoring,
          hasRestored,
          restoreError,
          restoreStats
     };
};
