'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkSessionStatus } from '@/store/examSlice';

/**
 * Hook untuk memastikan session_id selalu ada
 * Jika session_id null, akan otomatis fetch dari getSessionStatus
 */
export const useEnsureSessionId = () => {
     const dispatch = useAppDispatch();
     const { sessionId, currentExam, sessionStatus, isLoading } = useAppSelector((state) => state.exam);

     useEffect(() => {
          // Hanya check jika:
          // 1. Exam sudah dimulai (currentExam ada)
          // 2. Session status = progress
          // 3. Session ID masih null
          // 4. Tidak sedang loading
          if (currentExam && sessionStatus === 'progress' && !sessionId && !isLoading) {
               dispatch(checkSessionStatus(currentExam.exam_id));
          }
     }, [sessionId, currentExam, sessionStatus, isLoading, dispatch]);

     return { sessionId };
};
