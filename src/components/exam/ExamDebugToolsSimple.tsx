'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';

export const ExamDebugTools: React.FC = () => {
     const { examDuration } = useAppSelector((state) => state.exam);
     const isDevelopment = process.env.NODE_ENV === 'development';

     if (!isDevelopment) {
          return null; // Hanya tampil di development mode
     }

     const fifteenMinutesInSeconds = 15 * 60;
     const testThreshold = isDevelopment ? 30 : fifteenMinutesInSeconds;
     const isSubmitAllowed = examDuration <= testThreshold;

     return (
          <div className="fixed bottom-4 left-4 z-50">
               <Card className="p-4 bg-yellow-50 border-yellow-200 max-w-xs">
                    <h3 className="text-sm font-bold text-yellow-800 mb-2">
                         🔧 DEV: Submit Timer Debug
                    </h3>

                    <div className="space-y-2 text-xs">
                         <div className="grid grid-cols-2 gap-2">
                              <div>
                                   <strong>Waktu tersisa:</strong><br />
                                   {Math.floor(examDuration / 60)}m {examDuration % 60}s
                              </div>
                              <div>
                                   <strong>Submit Status:</strong><br />
                                   <span className={isSubmitAllowed ? 'text-green-600 font-bold' : 'text-red-600'}>
                                        {isSubmitAllowed ? '✅ ALLOWED' : '❌ BLOCKED'}
                                   </span>
                              </div>
                         </div>

                         <div className="p-2 bg-yellow-100 rounded text-xs">
                              <div className="font-medium mb-1">Submit Rules:</div>
                              <div>• Production: ≤ 15 menit (900s)</div>
                              <div>• Development: ≤ 30 detik</div>
                              <div className="mt-1 font-medium">
                                   Current threshold: ≤ {testThreshold}s
                              </div>
                         </div>

                         <div className="p-2 bg-blue-50 rounded text-xs">
                              <div className="font-medium mb-1">Testing Tips:</div>
                              <div>1. Tunggu sampai timer ≤ 30 detik</div>
                              <div>2. Tombol submit akan aktif</div>
                              <div>3. Notifikasi hijau akan muncul</div>
                         </div>
                    </div>
               </Card>
          </div>
     );
};
