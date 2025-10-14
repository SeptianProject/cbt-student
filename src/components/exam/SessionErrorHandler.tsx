'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useExamSessionManager } from '@/hooks/useExamSessionManager';

interface SessionErrorHandlerProps {
     examId: number;
     onSuccess?: () => void;
     onCancel?: () => void;
}

export const SessionErrorHandler: React.FC<SessionErrorHandlerProps> = ({
     examId,
     onSuccess,
     onCancel
}) => {
     const { clearSession, isClearing } = useExamSessionManager();

     const handleClearSession = async () => {
          try {
               const success = await clearSession(examId);
               if (success && onSuccess) {
                    onSuccess();
               }
          } catch (error) {
               console.error('Failed to clear session:', error);
               alert('Gagal membersihkan sesi. Silakan hubungi administrator.');
          }
     };

     return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
               <div className="text-center">
                    <div className="mb-4">
                         <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                         </div>
                    </div>

                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                         Sesi Ujian Aktif Terdeteksi
                    </h3>

                    <p className="text-red-600 text-sm mb-6">
                         Anda masih memiliki sesi ujian yang aktif untuk ujian ini.
                         Hal ini mungkin terjadi karena:
                    </p>

                    <ul className="text-left text-sm text-red-600 mb-6 space-y-1">
                         <li>• Browser tertutup saat mengerjakan ujian</li>
                         <li>• Koneksi internet terputus sebelumnya</li>
                         <li>• Sesi ujian tidak berakhir dengan normal</li>
                    </ul>

                    <p className="text-red-600 text-sm mb-6 font-medium">
                         Silakan bersihkan sesi yang lama untuk memulai ujian yang baru.
                    </p>

                    <div className="flex space-x-3 justify-center">
                         <Button
                              variant="destructive"
                              onClick={handleClearSession}
                              disabled={isClearing}
                              className="px-6"
                         >
                              {isClearing ? 'Membersihkan...' : 'Bersihkan Sesi'}
                         </Button>
                         <Button
                              variant="outline"
                              onClick={onCancel}
                              disabled={isClearing}
                         >
                              Batal
                         </Button>
                    </div>
               </div>
          </div>
     );
};
