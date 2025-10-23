'use client';

import React from 'react';
import { ExamTimer } from './ExamTimer';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { calculateExamProgress } from '@/lib/examUtils';
import { useAppSelector } from '@/store/hooks';

interface ExamProgressHeaderProps {
     onTimeUp: () => void;
     isSaving?: boolean;
     lastSavedTime?: Date | null;
     saveError?: string | null;
}

export const ExamProgressHeader: React.FC<ExamProgressHeaderProps> = ({
     onTimeUp,
     isSaving = false,
     lastSavedTime = null,
     saveError = null
}) => {
     const { questions, answers, examDuration } = useAppSelector((state) => state.exam);
     const { dashboardData } = useAppSelector((state) => state.auth);
     const progress = calculateExamProgress(answers, questions.length);

     return (
          <div className="bg-white shadow-sm border-b sticky top-0 z-40">
               <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                         <div>
                              <h1 className="text-lg font-semibold text-gray-800">
                                   {dashboardData?.student.name || 'Siswa'} - Kelas {dashboardData?.student.grade_id}
                              </h1>
                              <div className="flex items-center gap-3">
                                   <p className="text-sm text-gray-600">
                                        Ujian Berlangsung - Progress: {progress.answered}/{questions.length} terjawab
                                   </p>
                                   <SaveStatusIndicator
                                        isSaving={isSaving}
                                        lastSavedTime={lastSavedTime}
                                        saveError={saveError}
                                   />
                              </div>
                         </div>

                         <div className="flex items-center gap-4">
                              <ExamTimer
                                   initialTime={examDuration}
                                   onTimeUp={onTimeUp}
                                   autoSubmit={true}
                              />
                         </div>
                    </div>
               </div>
          </div>
     );
};
