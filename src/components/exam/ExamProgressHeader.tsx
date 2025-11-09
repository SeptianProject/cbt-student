'use client';

import React from 'react';
import { ExamTimer } from './ExamTimer';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { RestoreStatusIndicator } from './RestoreStatusIndicator';
import { BackupStatusIndicator } from './BackupStatusIndicator';
import { calculateExamProgress } from '@/lib/examUtils';
import { useAppSelector } from '@/store/hooks';

interface RestoreStats {
     totalRestored: number;
     multipleChoiceCount: number;
     essayCount: number;
     lastAnsweredAt: string | null;
}

interface ExamProgressHeaderProps {
     onTimeUp: () => void;
     onTimeUpdate?: (timeLeft: number) => void;
     // Auto-save status (per-answer save)
     isSaving?: boolean;
     lastSavedTime?: Date | null;
     saveError?: string | null;
     // Restore status
     isRestoring?: boolean;
     hasRestored?: boolean;
     restoreError?: string | null;
     restoreStats?: RestoreStats | null;
     // Periodic backup status (bulk save)
     isBackingUp?: boolean;
     lastBackupTime?: Date | null;
     backupError?: string | null;
     backupCount?: number;
}

export const ExamProgressHeader: React.FC<ExamProgressHeaderProps> = ({
     onTimeUp,
     onTimeUpdate,
     // Auto-save
     isSaving = false,
     lastSavedTime = null,
     saveError = null,
     // Restore
     isRestoring = false,
     hasRestored = false,
     restoreError = null,
     restoreStats = null,
     // Backup
     isBackingUp = false,
     lastBackupTime = null,
     backupError = null,
     backupCount = 0
}) => {
     const { questions, answers, examDuration, timeRemaining, currentExam } = useAppSelector((state) => state.exam);
     const { dashboardData } = useAppSelector((state) => state.auth);
     const progress = calculateExamProgress(answers, questions.length);

     return (
          <div className="bg-white shadow-sm border-b sticky top-0 z-40">
               <div className="max-w-7xl mx-auto px-4 py-3">
                    {/* Main header */}
                    <div className="flex justify-between items-center mb-2">
                         <div>
                              <h1 className="text-lg font-semibold text-gray-800">
                                   {dashboardData?.student.name || 'Siswa'} - Kelas {dashboardData?.student.grade_id}
                              </h1>
                              <p className="text-sm text-gray-600">
                                   Ujian Berlangsung - Progress: {progress.answered}/{questions.length} terjawab
                              </p>
                         </div>

                         <div className="flex items-center gap-4">
                              <ExamTimer
                                   initialTime={timeRemaining || examDuration}
                                   examId={currentExam?.exam_id}
                                   onTimeUp={onTimeUp}
                                   onTimeUpdate={onTimeUpdate}
                                   autoSubmit={true}
                              />
                         </div>
                    </div>

                    {/* Status indicators */}
                    <div className="flex items-center gap-3 flex-wrap">
                         {/* Restore status - show during restore or if answers were restored */}
                         <RestoreStatusIndicator
                              isRestoring={isRestoring}
                              hasRestored={hasRestored}
                              restoreError={restoreError}
                              restoreStats={restoreStats}
                         />

                         {/* Auto-save status - individual answer saves */}
                         {hasRestored && (
                              <SaveStatusIndicator
                                   isSaving={isSaving}
                                   lastSavedTime={lastSavedTime}
                                   saveError={saveError}
                              />
                         )}

                         {/* Periodic backup status - bulk saves every 2 minutes */}
                         {hasRestored && (
                              <BackupStatusIndicator
                                   isBackingUp={isBackingUp}
                                   lastBackupTime={lastBackupTime}
                                   backupError={backupError}
                                   backupCount={backupCount}
                              />
                         )}
                    </div>
               </div>
          </div>
     );
};
