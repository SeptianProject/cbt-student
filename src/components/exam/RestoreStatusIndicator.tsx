'use client';

import React from 'react';

interface RestoreStats {
     totalRestored: number;
     multipleChoiceCount: number;
     essayCount: number;
     lastAnsweredAt: string | null;
}

interface RestoreStatusIndicatorProps {
     isRestoring: boolean;
     hasRestored: boolean;
     restoreError: string | null;
     restoreStats: RestoreStats | null;
}

/**
 * Component untuk menampilkan status restore answers
 * 
 * Menampilkan:
 * - Loading saat restore berlangsung
 * - Success dengan detail jumlah jawaban yang direstore
 * - Error message jika restore gagal
 */
export const RestoreStatusIndicator: React.FC<RestoreStatusIndicatorProps> = ({
     isRestoring,
     hasRestored,
     restoreError,
     restoreStats
}) => {
     if (isRestoring) {
          return (
               <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Memulihkan jawaban Anda...</span>
               </div>
          );
     }

     if (restoreError) {
          return (
               <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex flex-col">
                         <span className="font-medium">Gagal memulihkan jawaban</span>
                         <span className="text-xs opacity-75">{restoreError}</span>
                    </div>
               </div>
          );
     }

     if (hasRestored && restoreStats && restoreStats.totalRestored > 0) {
          return (
               <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex flex-col">
                         <span className="font-medium">Jawaban berhasil dipulihkan! ✨</span>
                         <span className="text-xs opacity-75">
                              {restoreStats.totalRestored} jawaban
                              {restoreStats.multipleChoiceCount > 0 && ` (${restoreStats.multipleChoiceCount} pilihan ganda`}
                              {restoreStats.essayCount > 0 && `, ${restoreStats.essayCount} essay`}
                              {(restoreStats.multipleChoiceCount > 0 || restoreStats.essayCount > 0) && ')'}
                         </span>
                    </div>
               </div>
          );
     }

     return null;
};
