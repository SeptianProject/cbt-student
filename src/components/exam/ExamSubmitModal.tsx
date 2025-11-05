'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { calculateExamProgress } from '@/lib/examUtils';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setShowSubmitModal } from '@/store/examSlice';

interface ExamSubmitModalProps {
     onConfirmSubmit: () => void;
}

export const ExamSubmitModal: React.FC<ExamSubmitModalProps> = ({ onConfirmSubmit }) => {
     const dispatch = useAppDispatch();
     const { questions, answers, showSubmitModal, isSubmitting, isError, errorMessage } = useAppSelector((state) => state.exam);
     const progress = calculateExamProgress(answers, questions.length);

     // ✅ Prevent modal from closing during submission
     const handleClose = () => {
          if (!isSubmitting) {
               dispatch(setShowSubmitModal(false));
          }
     };

     return (
          <Modal
               isOpen={showSubmitModal}
               onClose={handleClose}
               // ✅ Prevent closing modal by clicking overlay during submission
               preventClose={isSubmitting}
          >
               <div className="space-y-4">
                    {/* Header dengan loading state */}
                    <div className="text-center mb-4">
                         {isSubmitting ? (
                              <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-2 animate-spin" />
                         ) : (
                              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                         )}
                         <h3 className="text-lg font-semibold text-gray-900">
                              {isSubmitting
                                   ? 'Mengirim Jawaban...'
                                   : 'Konfirmasi Selesai Ujian'
                              }
                         </h3>
                         {isSubmitting && (
                              <p className="text-sm text-gray-600 mt-2">
                                   Mohon tunggu, jangan tutup halaman ini
                              </p>
                         )}
                    </div>

                    <div className="flex items-start gap-3">
                         <div className="w-full">
                              {!isSubmitting ? (
                                   <>
                                        <p className="text-gray-800 mb-3 text-center">
                                             Apakah Anda yakin ingin menyelesaikan ujian sekarang?
                                        </p>
                                        <ul className="text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded-lg">
                                             <li className="flex justify-between">
                                                  <span>Soal terjawab:</span>
                                                  <span className="font-semibold">{progress.answered}/{questions.length}</span>
                                             </li>
                                             <li className="flex justify-between">
                                                  <span>Soal ditandai:</span>
                                                  <span className="font-semibold">{progress.flagged}</span>
                                             </li>
                                             <li className="flex justify-between">
                                                  <span>Soal belum dijawab:</span>
                                                  <span className="font-semibold">{progress.unanswered}</span>
                                             </li>
                                        </ul>

                                        {progress.unanswered > 0 && (
                                             <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                  <p className="text-orange-700 text-sm flex items-center gap-2">
                                                       <AlertTriangle className="h-4 w-4" />
                                                       <span>Masih ada <strong>{progress.unanswered} soal</strong> yang belum dijawab.</span>
                                                  </p>
                                             </div>
                                        )}
                                   </>
                              ) : (
                                   <div className="text-center">
                                        <p className="text-gray-700">
                                             Sistem sedang memproses jawaban Anda...
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                             Proses ini mungkin memakan waktu beberapa saat
                                        </p>
                                   </div>
                              )}
                         </div>
                    </div>

                    {/* Error message */}
                    {isError && errorMessage && !isSubmitting && (
                         <div className="bg-red-50 border border-red-200 rounded-md p-3">
                              <div className="flex items-center gap-2">
                                   <AlertTriangle className="h-4 w-4 text-red-600" />
                                   <p className="text-sm text-red-600">{errorMessage}</p>
                              </div>
                         </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                         <Button
                              variant="outline"
                              onClick={handleClose}
                              disabled={isSubmitting}
                              className="flex-1">
                              Lanjut Mengerjakan
                         </Button>
                         <Button
                              onClick={onConfirmSubmit}
                              disabled={isSubmitting}
                              className="flex-1 bg-primary/90 hover:bg-primary text-white">
                              {isSubmitting ? (
                                   <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Mengirim...
                                   </span>
                              ) : (
                                   'Ya, Selesai Ujian'
                              )}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
};
