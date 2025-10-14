'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';

interface ExamDebugToolsProps {
     onTimeSet?: (seconds: number) => void;
}

export const ExamDebugTools: React.FC<ExamDebugToolsProps> = ({ onTimeSet }) => {
     const { examDuration } = useAppSelector((state) => state.exam);
     const [customTime, setCustomTime] = useState('');
     const isDevelopment = process.env.NODE_ENV === 'development';

     if (!isDevelopment) {
          return null; // Hanya tampil di development mode
     }

     const handleSetTime = () => {
          const seconds = parseInt(customTime);
          if (!isNaN(seconds) && seconds > 0) {
               onTimeSet?.(seconds);
               setCustomTime('');
          }
     };

     const presetTimes = [
          { label: '2 jam', seconds: 2 * 60 * 60 },
          { label: '1 jam', seconds: 60 * 60 },
          { label: '30 menit', seconds: 30 * 60 },
          { label: '20 menit', seconds: 20 * 60 },
          { label: '15 menit', seconds: 15 * 60 },
          { label: '10 menit', seconds: 10 * 60 },
          { label: '5 menit', seconds: 5 * 60 },
          { label: '2 menit', seconds: 2 * 60 },
          { label: '1 menit', seconds: 60 },
          { label: '30 detik', seconds: 30 },
          { label: '10 detik', seconds: 10 },
     ];

     return (
          <div className="fixed bottom-4 left-4 z-50">
               <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <h3 className="text-sm font-bold text-yellow-800 mb-2">
                         🔧 DEV: Exam Timer Controls
                    </h3>

                    <div className="text-xs text-gray-600 mb-2">
                         Current: {Math.floor(examDuration / 60)}m {examDuration % 60}s
                    </div>

                    <div className="space-y-2">
                         <div className="flex gap-1 flex-wrap">
                              {presetTimes.map((preset) => (
                                   <Button
                                        key={preset.label}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onTimeSet?.(preset.seconds)}
                                        className="text-xs h-6 px-2"
                                   >
                                        {preset.label}
                                   </Button>
                              ))}
                         </div>

                         <div className="flex gap-1">
                              <input
                                   type="number"
                                   placeholder="Detik"
                                   value={customTime}
                                   onChange={(e) => setCustomTime(e.target.value)}
                                   className="w-16 px-1 py-1 text-xs border rounded"
                              />
                              <Button
                                   size="sm"
                                   onClick={handleSetTime}
                                   className="text-xs h-6"
                              >
                                   Set
                              </Button>
                         </div>

                         <div className="text-xs mt-2 p-2 bg-yellow-100 rounded">
                              <div className="font-medium">Submit Rules:</div>
                              <div>• Production: 15 menit sebelum selesai</div>
                              <div>• Development: 30 detik sebelum selesai</div>
                         </div>
                    </div>
               </Card>
          </div>
     );
};
