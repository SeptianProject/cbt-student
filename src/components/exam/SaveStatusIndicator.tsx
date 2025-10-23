'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SaveStatusIndicatorProps {
     isSaving: boolean;
     lastSavedTime: Date | null;
     saveError: string | null;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
     isSaving,
     lastSavedTime,
     saveError
}) => {
     const formatTime = (date: Date) => {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const seconds = date.getSeconds().toString().padStart(2, '0');
          return `${hours}:${minutes}:${seconds}`;
     };

     if (isSaving) {
          return (
               <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan jawaban...</span>
               </div>
          );
     }

     if (saveError) {
          return (
               <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Gagal menyimpan: {saveError}</span>
               </div>
          );
     }

     if (lastSavedTime) {
          return (
               <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Tersimpan pada {formatTime(lastSavedTime)}</span>
               </div>
          );
     }

     return null;
};
