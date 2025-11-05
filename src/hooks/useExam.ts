import { useMutation } from '@tanstack/react-query';
import { examService } from '@/services/exam';
import { Exam } from '@/types';
import { useState } from 'react';

export function useExam() {
     const [currentExamId, setCurrentExamId] = useState<string | null>(null);
     const [examData, setExamData] = useState<Exam | null>(null);
     const [examResult, setExamResult] = useState(null);

     const startExamMutation = useMutation({
          mutationFn: examService.examStart,
          onSuccess: (data) => {
               setExamData(data);
          },
          onError: (error) => {
               console.error('Failed to start exam:', error);
          }
     });

     const startExam = async (examId: string) => {
          setCurrentExamId(examId);
          return await startExamMutation.mutateAsync(Number(examId)
          );
     };

     const resetExam = () => {
          setCurrentExamId(null);
          setExamData(null);
          setExamResult(null);
     };

     return {
          examData,
          examResult,
          currentExamId,
          startExam,
          resetExam,
          isStartingExam: startExamMutation.isPending,
          startExamError: startExamMutation.error,
          isExamStarted: !!examData?.exam && examData.exam.length > 0,
          isExamSubmitted: !!examResult
     };
}
