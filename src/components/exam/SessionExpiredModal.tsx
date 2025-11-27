'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AlertTriangle, Clock, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SessionExpiredModalProps {
     isOpen: boolean;
     onClose: () => void;
     message?: string;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
     isOpen,
     onClose,
     message = 'Waktu ujian Anda sudah habis atau sesi tidak valid lagi.'
}) => {
     const router = useRouter();

     const handleGoToDashboard = () => {
          onClose();
          // Clean up localStorage
          localStorage.removeItem('session_token');
          localStorage.removeItem('exam_id');
          localStorage.removeItem('exam_duration');
          localStorage.removeItem('current_exam_slug');

          router.push('/dashboard');
     };

     return (
          <Modal isOpen={isOpen} onClose={() => { }}>
               <div className="space-y-4 text-center">
                    <div className="flex justify-center mb-4">
                         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                              <Clock className="h-8 w-8 text-red-600" />
                         </div>
                    </div>

                    <div className="mb-4">
                         <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                         <h3 className="text-lg font-semibold text-gray-900">
                              Waktu Ujian Habis
                         </h3>
                    </div>

                    <div className="text-center">
                         <p className="text-gray-700 mb-4">
                              {message}
                         </p>
                         <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                              <p className="text-sm text-red-700">
                                   Silakan kembali ke halaman utama untuk melihat ujian yang tersedia.
                              </p>
                         </div>
                    </div>

                    <div className="flex justify-center">
                         <Button
                              onClick={handleGoToDashboard}
                              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                         >
                              <Home className="w-4 h-4" />
                              Kembali ke Dashboard
                         </Button>
                    </div>
               </div>
          </Modal>
     );
};
