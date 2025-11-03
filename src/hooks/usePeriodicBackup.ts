'use client';

import { useEffect, useRef, useState } from 'react';
import { examService } from '@/services/exam';
import { StudentAnswer, ParsedQuestion } from '@/types';

interface UsePeriodicBackupOptions {
     sessionId: number | null;
     answers: Record<number, StudentAnswer>;
     questions: ParsedQuestion[];
     enabled?: boolean;
     intervalMs?: number; // Default: 2 minutes
}

/**
 * Hook untuk periodic backup semua jawaban ke temporary table
 * 
 * Fitur:
 * - Auto backup setiap X menit (default: 2 menit)
 * - Backup hanya dilakukan jika ada jawaban
 * - Tidak mengganggu exam jika backup gagal
 * - Status backup visible untuk debugging
 * 
 * Cara Kerja:
 * 1. Timer berjalan setiap intervalMs
 * 2. Cek apakah ada jawaban yang perlu di-backup
 * 3. Panggil endpoint POST /api/siswa/exam-session/save-answers
 * 4. Update status backup
 */
export const usePeriodicBackup = ({
     sessionId,
     answers,
     questions,
     enabled = true,
     intervalMs = 2 * 60 * 1000, // 2 minutes default
}: UsePeriodicBackupOptions) => {
     const [isBackingUp, setIsBackingUp] = useState(false);
     const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
     const [backupError, setBackupError] = useState<string | null>(null);
     const [backupCount, setBackupCount] = useState(0);

     const timerRef = useRef<NodeJS.Timeout | null>(null);
     const isBackingUpRef = useRef(false);

     useEffect(() => {
          // Clear existing timer
          if (timerRef.current) {
               clearInterval(timerRef.current);
               timerRef.current = null;
          }

          // Skip if disabled or no session
          if (!enabled || !sessionId) {
               return;
          }

          const performBackup = async () => {
               // Skip if already backing up or no answers
               if (isBackingUpRef.current || Object.keys(answers).length === 0) {
                    return;
               }

               isBackingUpRef.current = true;
               setIsBackingUp(true);
               setBackupError(null);

               try {
                    console.log('🕒 Periodic backup triggered...', {
                         sessionId,
                         answersCount: Object.keys(answers).length,
                         backupNumber: backupCount + 1
                    });

                    const result = await examService.saveAnswersBackup(
                         sessionId,
                         answers,
                         questions
                    );

                    if (result.success) {
                         setLastBackupTime(new Date());
                         setBackupCount(prev => prev + 1);
                         console.log('✅ Periodic backup successful:', {
                              backupNumber: backupCount + 1,
                              timestamp: new Date().toISOString()
                         });
                    } else {
                         console.warn('⚠️ Backup completed with warnings:', result.message);
                    }
               } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Backup failed';
                    console.error('❌ Periodic backup error:', errorMessage);
                    setBackupError(errorMessage);
               } finally {
                    setIsBackingUp(false);
                    isBackingUpRef.current = false;
               }
          };

          // Initial backup after 5 seconds (to avoid conflict with restore)
          const initialTimer = setTimeout(() => {
               performBackup();
          }, 5000);

          // Setup periodic backup
          timerRef.current = setInterval(() => {
               performBackup();
          }, intervalMs);

          // Cleanup
          return () => {
               clearTimeout(initialTimer);
               if (timerRef.current) {
                    clearInterval(timerRef.current);
               }
          };
     }, [sessionId, enabled, intervalMs, answers, questions, backupCount]);

     return {
          isBackingUp,
          lastBackupTime,
          backupError,
          backupCount,
          backupIntervalMs: intervalMs
     };
};
