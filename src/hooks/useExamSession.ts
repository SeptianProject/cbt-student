'use client';

import { useEffect, useCallback, useState } from 'react';
import { examService } from '@/services/exam';
import { SessionStatus } from '@/types';

interface UseExamSessionOptions {
     examId: number | null;
     checkInterval?: number; // in milliseconds
     enabled?: boolean;
}

export const useExamSession = ({ examId, checkInterval = 30000, enabled = true }: UseExamSessionOptions) => {
     const [sessionStatus, setSessionStatus] = useState<SessionStatus['data'] | null>(null);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     // Debug logging
     useEffect(() => {
          if (process.env.NODE_ENV === 'development') {
          }
     }, [examId, enabled]);

     const checkSessionStatus = useCallback(async () => {
          if (!examId || !enabled) return;

          // Check if session token exists before making API call
          const sessionToken = localStorage.getItem('session_token');
          if (!sessionToken) {
               return;
          }

          try {
               setIsLoading(true);
               setError(null);
               const response = await examService.getSessionStatus(examId);

               if (response.success) {
                    setSessionStatus(response.data);
               } else {
                    // Only set error if it's a real session issue, not missing token
                    if (response.message !== 'Session token tidak ditemukan.') {
                         setError(response.message || 'Gagal memeriksa status sesi');
                    }
               }
          } catch (err) {
               // Only treat as error if it's not a missing token issue or 404 session not found
               if (err instanceof Error) {
                    const isTokenError = err.message.includes('Session token tidak ditemukan') ||
                         err.message.includes('Session tidak ditemukan') ||
                         err.message.includes('404');

                    if (!isTokenError) {
                         setError(err.message);
                         console.error('Session status check failed:', err);
                    } else {
                    }
               }
          } finally {
               setIsLoading(false);
          }
     }, [examId, enabled]);

     // Initial check - only if we have session token
     useEffect(() => {
          if (enabled && examId && typeof window !== 'undefined') {
               const sessionToken = localStorage.getItem('session_token');
               if (sessionToken) {
                    checkSessionStatus();
               }
          }
     }, [examId, enabled, checkSessionStatus]);

     // Periodic checks - only if we have session token
     useEffect(() => {
          if (!enabled || !examId) return;

          const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
          if (!sessionToken) return;

          const interval = setInterval(() => {
               const currentSessionToken = localStorage.getItem('session_token');
               if (currentSessionToken) {
                    checkSessionStatus();
               }
          }, checkInterval);

          return () => clearInterval(interval);
     }, [checkSessionStatus, checkInterval, enabled, examId]);

     return {
          sessionStatus,
          isLoading,
          error,
          checkSessionStatus,
          isSessionValid: sessionStatus?.status === 'progress' && !sessionStatus?.is_expired,
          isSessionExpired: sessionStatus?.is_expired || sessionStatus?.status === 'submited',
          timeRemaining: sessionStatus?.time_remaining || 0,
     };
};
