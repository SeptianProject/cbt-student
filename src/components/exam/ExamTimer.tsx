'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ExamTimerProps {
     initialTime: number;
     examId?: number; // Add examId for localStorage key
     onTimeUp: () => void;
     onTimeUpdate?: (timeLeft: number) => void;
     autoSubmit?: boolean;
}

export function ExamTimer({ initialTime, examId, onTimeUp, onTimeUpdate, autoSubmit = true }: ExamTimerProps) {
     const [timeLeft, setTimeLeft] = useState(initialTime);
     const [isWarning, setIsWarning] = useState(false);
     const timerRef = useRef<NodeJS.Timeout | null>(null);
     const hasCalledTimeUpRef = useRef(false);

     // Initialize timer from Redux state or localStorage
     useEffect(() => {
          if (examId) {
               const examStartKey = `exam_start_time_${examId}`;
               const examDurationKey = `exam_duration_${examId}`;

               const startTimeStr = localStorage.getItem(examStartKey);
               const durationStr = localStorage.getItem(examDurationKey);

               if (startTimeStr && durationStr) {
                    const startTime = parseInt(startTimeStr, 10);
                    const duration = parseInt(durationStr, 10);
                    const now = Date.now();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    const remainingTime = Math.max(0, duration - elapsedSeconds);

                    // Only update if different from initialTime (to use server time if available)
                    if (remainingTime !== initialTime && remainingTime > 0) {
                         setTimeLeft(remainingTime);

                         // Update Redux state
                         if (onTimeUpdate) {
                              queueMicrotask(() => {
                                   onTimeUpdate(remainingTime);
                              });
                         }
                    } else {
                         setTimeLeft(initialTime);
                    }
               } else { 
                    setTimeLeft(initialTime);
               }
          } else {
               setTimeLeft(initialTime);
          }
     }, [examId, initialTime, onTimeUpdate]);

     // Timer countdown
     useEffect(() => {
          if (timeLeft <= 0) {
               // Prevent multiple calls
               if (!hasCalledTimeUpRef.current) {
                    hasCalledTimeUpRef.current = true;
                    onTimeUp();

                    // Clean up localStorage
                    if (examId) {
                         localStorage.removeItem(`exam_start_time_${examId}`);
                         localStorage.removeItem(`exam_duration_${examId}`);
                    }
               }
               return;
          }

          // Show warning when 15 minutes left (submit becomes available)
          if (timeLeft <= 900 && !isWarning) {
               setIsWarning(true);
          }

          // Clear any existing timer
          if (timerRef.current) {
               clearInterval(timerRef.current);
          }

          timerRef.current = setInterval(() => {
               setTimeLeft(prev => {
                    const newTime = Math.max(0, prev - 1);

                    // Call onTimeUpdate in next tick to avoid setState during render
                    if (onTimeUpdate && newTime >= 0) {
                         queueMicrotask(() => {
                              onTimeUpdate(newTime);
                         });
                    }

                    return newTime;
               });
          }, 1000);

          return () => {
               if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
               }
          };
     }, [timeLeft, onTimeUp, onTimeUpdate, autoSubmit, isWarning, examId]);

     const formatTime = (seconds: number) => {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;

          if (hours > 0) {
               return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          }
          return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
     };

     const getTimerColor = () => {
          const percentage = (timeLeft / initialTime) * 100;
          const fifteenMinutesInSeconds = 15 * 60; // 900 seconds

          if (percentage <= 5) return 'text-red-600 animate-pulse';
          if (percentage <= 10) return 'text-red-600';
          if (timeLeft <= fifteenMinutesInSeconds) return 'text-orange-600';
          return 'text-green-600';
     };

     const getProgressBarColor = () => {
          const percentage = (timeLeft / initialTime) * 100;
          if (percentage <= 10) return 'bg-red-500';
          if (percentage <= 25) return 'bg-orange-500';
          return 'bg-green-500';
     };

     const progressPercentage = Math.max(0, (timeLeft / initialTime) * 100);

     return (
          <Card className={`p-4 ${isWarning ? 'border-orange-500 bg-orange-50' : ''}`}>
               <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                         <Clock className="h-5 w-5 text-gray-600" />
                         <span className="font-medium text-gray-700">Waktu Tersisa</span>
                    </div>
                    {/* {isWarning && (
                         <div className="flex items-center gap-1 text-orange-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">Perhatian!</span>
                         </div>
                    )} */}
               </div>

               <div className={`text-2xl font-bold ${getTimerColor()} mb-3`}>
                    {formatTime(timeLeft)}
               </div>

               {/* Progress Bar */}
               <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                         className={`h-2 rounded-full transition-all duration-1000 ${getProgressBarColor()}`}
                         style={{ width: `${progressPercentage}%` }}
                    ></div>
               </div>

               {isWarning && (
                    <div className="mt-2">
                         <p className="text-xs text-orange-700">
                              {timeLeft <= 300
                                   ? "Waktu hampir habis! Segera selesaikan ujian Anda."
                                   : "Tombol submit ujian sudah tersedia!"}
                         </p>
                    </div>
               )}
          </Card>
     );
}
