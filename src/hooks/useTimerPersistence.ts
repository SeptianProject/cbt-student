'use client';

import { useEffect, useCallback } from 'react';

interface UseTimerPersistenceOptions {
     examId: number | null | undefined;
     duration: number;
     enabled?: boolean;
}

/**
 * Hook to manage exam timer persistence across page refreshes
 * Stores exam start time in localStorage and calculates remaining time
 */
export const useTimerPersistence = ({
     examId,
     duration,
     enabled = true
}: UseTimerPersistenceOptions) => {
     const examStartKey = examId ? `exam_start_time_${examId}` : null;
     const examDurationKey = examId ? `exam_duration_${examId}` : null;

     /**
      * Initialize timer - store start time if not exists
      */
     const initializeTimer = useCallback(() => {
          if (!enabled || !examId || !examStartKey || !examDurationKey) return;

          const existingStartTime = localStorage.getItem(examStartKey);

          if (!existingStartTime) {
               // First time starting exam - store current time
               const now = Date.now();
               localStorage.setItem(examStartKey, now.toString());
               localStorage.setItem(examDurationKey, duration.toString());
          }
     }, [enabled, examId, examStartKey, examDurationKey, duration]);

     /**
      * Calculate remaining time based on elapsed time
      */
     const calculateRemainingTime = useCallback((): number => {
          if (!enabled || !examId || !examStartKey || !examDurationKey) {
               return duration;
          }

          const startTimeStr = localStorage.getItem(examStartKey);
          const durationStr = localStorage.getItem(examDurationKey);

          if (!startTimeStr || !durationStr) {
               return duration;
          }

          const startTime = parseInt(startTimeStr, 10);
          const examDuration = parseInt(durationStr, 10);
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const remainingTime = Math.max(0, examDuration - elapsedSeconds);

          return remainingTime;
     }, [enabled, examId, examStartKey, examDurationKey, duration]);

     /**
      * Clear timer data from localStorage
      */
     const clearTimer = useCallback(() => {
          if (!examId || !examStartKey || !examDurationKey) return;

          localStorage.removeItem(examStartKey);
          localStorage.removeItem(examDurationKey);
     }, [examId, examStartKey, examDurationKey]);

     /**
      * Get exam start timestamp
      */
     const getStartTime = useCallback((): number | null => {
          if (!examStartKey) return null;

          const startTimeStr = localStorage.getItem(examStartKey);
          return startTimeStr ? parseInt(startTimeStr, 10) : null;
     }, [examStartKey]);

     /**
      * Check if timer has expired
      */
     const isExpired = useCallback((): boolean => {
          const remaining = calculateRemainingTime();
          return remaining <= 0;
     }, [calculateRemainingTime]);

     // Initialize timer on mount
     useEffect(() => {
          if (enabled && examId) {
               initializeTimer();
          }
     }, [enabled, examId, initializeTimer]);

     return {
          initializeTimer,
          calculateRemainingTime,
          clearTimer,
          getStartTime,
          isExpired,
     };
};
