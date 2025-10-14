'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AlertTriangle } from 'lucide-react';
import { calculateExamProgress } from '@/lib/examUtils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setShowSubmitModal } from '@/store/examSlice';

interface ExamSubmitModalProps {
     onConfirmSubmit: () => void;
     examDuration: number;
}

export const ExamSubmitModal: React.FC<ExamSubmitModalProps> = ({ onConfirmSubmit, examDuration }) => {
     const dispatch = useAppDispatch();
     const { questions, answers, showSubmitModal, isSubmitting, isError, errorMessage } = useAppSelector((state) => state.exam);
     const progress = calculateExamProgress(answers, questions.length);

     const handleClose = () => {
          if (!isSubmitting) {
               dispatch(setShowSubmitModal(false));
          }
     };

     return (
          <Modal isOpen={showSubmitModal} onClose={handleClose}>
               <div className="space-y-4">
                    <div className="text-center mb-4">
                         <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                         <h3 className="text-lg font-semibold text-gray-900">
                              {examDuration < 900 ? `Masih ada sisa waktu ${examDuration - 15 * 60} detik` : 'Konfirmasi Selesai Ujian'}
                         </h3>
                    </div>

                    <div className="flex items-start gap-3">
                         <div>
                              <p className="text-gray-800 mb-2">
                                   Anda akan menyelesaikan ujian dengan kondisi berikut:
                              </p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                   <li>• Soal terjawab: {progress.answered}/{questions.length}</li>
                                   <li>• Soal ditandai: {progress.flagged}</li>
                                   <li>• Soal belum dijawab: {progress.unanswered}</li>
                              </ul>

                              {progress.unanswered > 0 && (
                                   <p className="text-orange-600 text-sm mt-2">
                                        Masih ada {progress.unanswered} soal yang belum dijawab.
                                   </p>
                              )}
                         </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                         {isError && errorMessage && (
                              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                                   <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        <p className="text-sm text-red-600">{errorMessage}</p>
                                   </div>
                              </div>
                         )}

                         <Button
                              variant="outline"
                              onClick={handleClose}
                              disabled={isSubmitting}
                              className="flex-1">
                              {isSubmitting ? 'Mengirim...' : 'Lanjut Mengerjakan'}
                         </Button>
                         <Button
                              onClick={onConfirmSubmit}
                              disabled={isSubmitting}
                              className="flex-1 bg-primary/90 hover:bg-primary text-white">
                              {isSubmitting ? 'Mengirim Jawaban...' : 'Selesai Ujian'}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
};
