'use client';

import { useEffect, useState, useCallback } from 'react';
import { AssignedExam } from '@/types';

interface UseAutoExamSelectionProps {
     assignedExams?: AssignedExam[];
     currentExamId?: string;
     enableAutoSelection?: boolean;
}

interface ExamStatus {
     exam_id: number;
     status: 'not_started' | 'in_progress' | 'completed';
     last_accessed?: string;
}

export const useAutoExamSelection = ({
     assignedExams,
     currentExamId,
     enableAutoSelection = true
}: UseAutoExamSelectionProps) => {
     const [isAutoSelecting, setIsAutoSelecting] = useState(false);

     // Get exam statuses from localStorage (in real app, this would come from API)
     const getExamStatuses = useCallback((): ExamStatus[] => {
          const saved = localStorage.getItem('exam_statuses');
          if (saved) {
               try {
                    return JSON.parse(saved);
               } catch {
                    return [];
               }
          }
          return [];
     }, []);

     // Save exam status
     const updateExamStatus = useCallback((examId: number, status: ExamStatus['status']) => {
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

     // Find the next exam to work on based on order
     const findNextExam = useCallback((exams: AssignedExam[]): AssignedExam | null => {
          if (!exams || exams.length === 0) return null;

          const statuses = getExamStatuses();

          // Sort exams by order (assuming the array order is the intended sequence)
          const sortedExams = [...exams];

          // Priority 1: Find exam in progress
          const inProgressStatus = statuses.find(s => s.status === 'in_progress');
          if (inProgressStatus) {
               const inProgressExam = sortedExams.find(e => e.exam_id === inProgressStatus.exam_id);
               if (inProgressExam) return inProgressExam;
          }

          // Priority 2: Find first exam not started (in order)
          for (const exam of sortedExams) {
               const status = statuses.find(s => s.exam_id === exam.exam_id);
               if (!status || status.status === 'not_started') {
                    return exam;
               }
          }

          // Priority 3: Return first exam if all are completed (for review)
          return sortedExams[0] || null;
     }, [getExamStatuses]);

     // Get the current selected exam from the assigned exams
     const getCurrentExam = useCallback((exams: AssignedExam[], examId: string): AssignedExam | null => {
          if (!exams || !examId) return null;
          return exams.find(exam => exam.exam_id.toString() === examId) || null;
     }, []);

     // Auto-select exam logic
     useEffect(() => {
          if (!assignedExams || assignedExams.length === 0 || !enableAutoSelection) return;

          // If no exam is currently selected
          if (!currentExamId) {
               setIsAutoSelecting(true);

               const nextExam = findNextExam(assignedExams);

               if (nextExam) {
                    localStorage.setItem('exam_id', nextExam.exam_id.toString());
                    localStorage.setItem('exam_duration', nextExam.duration.toString());


                    // Small delay to prevent race condition
                    setTimeout(() => {
                         setIsAutoSelecting(false);
                    }, 500);
               } else {
                    setIsAutoSelecting(false);
               }
          } else {
               setIsAutoSelecting(false);
          }
     }, [assignedExams, currentExamId, enableAutoSelection, findNextExam]);

     return {
          isAutoSelecting,
          findNextExam,
          updateExamStatus,
          getExamStatuses,
          getCurrentExam
     };
};
