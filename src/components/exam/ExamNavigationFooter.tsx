'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExamNavigationFooterProps {
     onPrevious: () => void;
     onNext: () => void;
     onSubmit: () => void;
     isFirstQuestion: boolean;
     isLastQuestion: boolean;
     isSubmitAllowed: boolean;
}

export const ExamNavigationFooter: React.FC<ExamNavigationFooterProps> = ({
     onPrevious,
     onNext,
     onSubmit,
     isFirstQuestion,
     isLastQuestion,
     isSubmitAllowed
}) => {
     return (
          <div className='sticky bottom-0 left-0'>
               <Card>
                    <div className="flex justify-center items-center p-5 gap-20">
                         <Button
                              variant="outline"
                              onClick={onPrevious}
                              disabled={isFirstQuestion}
                              className="flex items-center gap-2 hover:bg-gray-100"
                         >
                              <ChevronLeft className="h-4 w-4" />
                              Sebelumnya
                         </Button>

                         {/* Jika sudah soal terakhir dan submit diizinkan maka bisa disubmit */}
                         {isLastQuestion ? (
                              <Button
                                   onClick={onSubmit}
                                   disabled={!isSubmitAllowed}
                                   className={`flex items-center gap-2 ${isSubmitAllowed
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}>
                                   {isSubmitAllowed ? 'Selesai Ujian' : 'Jawab Semua Soal untuk Submit'}
                              </Button>
                         ) : (
                              <Button
                                   onClick={onNext}
                                   className="flex items-center gap-2">
                                   Selanjutnya
                                   <ChevronRight className="h-4 w-4" />
                              </Button>
                         )}
                    </div>
               </Card>
          </div>
     );
};
