'use client';

import { useState, useCallback } from 'react';
import { examService } from '@/services/exam';

export const useExamSessionManager = () => {
     const [isClearing, setIsClearing] = useState(false);
     const [isChecking, setIsChecking] = useState(false);

     const clearSession = useCallback(async (examId: number) => {
          setIsClearing(true);
          try {
               await examService.forceEndSession(examId);
               return true;
          } catch (error) {
               console.error('Error clearing session:', error);
               return false;
          } finally {
               setIsClearing(false);
          }
     }, []);

     const checkSession = useCallback(async (examId: number) => {
          setIsChecking(true);
          try {
               const hasActiveSession = await examService.checkActiveSession(examId);
               return hasActiveSession;
          } catch (error) {
               console.error('Error checking session:', error);
               return false;
          } finally {
               setIsChecking(false);
          }
     }, []);

     const clearAndStart = useCallback(async (examId: number) => {
          try {
               // Clear any existing session first
               await clearSession(examId);

               // Start the exam
               return await examService.examStartSafe(examId);
          } catch (error) {
               console.error('Error in clearAndStart:', error);
               throw error;
          }
     }, [clearSession]);

     return {
          isClearing,
          isChecking,
          clearSession,
          checkSession,
          clearAndStart,
     };
};
