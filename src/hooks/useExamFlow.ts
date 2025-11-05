'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AssignedExam } from '@/types';

interface ExamStatus {
     exam_id: number;
     status: 'not_started' | 'in_progress' | 'completed';
     last_accessed?: string;
}

export const useExamFlow = () => {
     const router = useRouter();

     // Get exam statuses from localStorage
     const getExamStatuses = useCallback((): ExamStatus[] => {
          if (typeof window === 'undefined') return [];
          const saved = localStorage.getItem('exam_statuses');
          if (saved) {
               try {
                    const statuses = JSON.parse(saved);
                    return statuses;
               } catch {
                    return [];
               }
          }
          return [];
     }, []);

     // Update exam status
     const updateExamStatus = useCallback((examId: number, status: ExamStatus['status']) => {
          if (typeof window === 'undefined') return;
          const statuses = getExamStatuses();
          const existingIndex = statuses.findIndex(s => s.exam_id === examId);

          const newStatus: ExamStatus = {
               exam_id: examId,
               status,
               last_accessed: new Date().toISOString()
          };

          if (existingIndex >= 0) {
               statuses[existingIndex] = newStatus;
          } else {
               statuses.push(newStatus);
          }

          localStorage.setItem('exam_statuses', JSON.stringify(statuses));
     }, [getExamStatuses]);

     // Find next exam in sequence
     const findNextExam = useCallback((exams: AssignedExam[], completedExamId?: number): AssignedExam | null => {
          if (!exams || exams.length === 0) {
               return null;
          }

          const statuses = getExamStatuses();

          if (completedExamId) {
               const currentIndex = exams.findIndex(exam => exam.exam_id === completedExamId);

               if (currentIndex >= 0 && currentIndex < exams.length - 1) {
                    const nextExam = exams[currentIndex + 1];
                    const nextStatus = statuses.find(s => s.exam_id === nextExam.exam_id);

                    if (!nextStatus || nextStatus.status !== 'completed') {
                         return nextExam;
                    }
               }
          }

          // Fallback: find first incomplete exam
          for (const exam of exams) {
               const status = statuses.find(s => s.exam_id === exam.exam_id);
               if (!status || status.status !== 'completed') {
                    return exam;
               }
          }

          return null;
     }, [getExamStatuses]);

     // Check if all exams are completed
     const areAllExamsCompleted = useCallback((exams: AssignedExam[]): boolean => {
          if (!exams || exams.length === 0) return true;

          const statuses = getExamStatuses();
          return exams.every(exam => {
               const status = statuses.find(s => s.exam_id === exam.exam_id);
               return status && status.status === 'completed';
          });
     }, [getExamStatuses]);

     // Get exam progress stats
     const getExamProgress = useCallback((exams: AssignedExam[]) => {
          if (!exams || exams.length === 0) {
               return { total: 0, completed: 0, inProgress: 0, notStarted: 0 };
          }

          const statuses = getExamStatuses();
          let completed = 0;
          let inProgress = 0;
          let notStarted = 0;

          exams.forEach(exam => {
               const status = statuses.find(s => s.exam_id === exam.exam_id);
               if (!status || status.status === 'not_started') {
                    notStarted++;
               } else if (status.status === 'in_progress') {
                    inProgress++;
               } else if (status.status === 'completed') {
                    completed++;
               }
          });

          return {
               total: exams.length,
               completed,
               inProgress,
               notStarted
          };
     }, [getExamStatuses]);

     // Navigate to next exam or dashboard
     const handleExamCompletion = useCallback((
          completedExamId: number,
          allExams: AssignedExam[]
     ) => {
          updateExamStatus(completedExamId, 'completed');

          const nextExam = findNextExam(allExams, completedExamId);

          if (nextExam) {
               localStorage.setItem('exam_id', nextExam.exam_id.toString());
               localStorage.setItem('exam_duration', nextExam.duration.toString());
               updateExamStatus(nextExam.exam_id, 'in_progress');

               setTimeout(() => {
                    router.push('/exam');
               }, 2000);
          } else {
               localStorage.removeItem('exam_id');
               localStorage.removeItem('exam_duration');

               setTimeout(() => {
                    router.push('/dashboard');
               }, 3000);
          }
     }, [updateExamStatus, findNextExam, router]);

     return {
          getExamStatuses,
          updateExamStatus,
          findNextExam,
          areAllExamsCompleted,
          getExamProgress,
          handleExamCompletion
     };
};
