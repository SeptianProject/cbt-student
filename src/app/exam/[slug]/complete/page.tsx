'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, Home, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth';
import { findExamBySlug, createExamSlug } from '@/lib/examUtils';
import { useExamFlow } from '@/hooks/useExamFlow';
import { ExamSubmitResult } from '@/types';
import { useAppDispatch } from '@/store/hooks';
import { resetExamState } from '@/store/examSlice';
import { examService } from '@/services/exam';

export default function ExamCompletePage() {
     const router = useRouter();
     const params = useParams();
     const currentSlug = params.slug as string;
     const [countdown, setCountdown] = useState(5);
     const [isTransitioning, setIsTransitioning] = useState(false);
     const [examResult, setExamResult] = useState<ExamSubmitResult['data'] | null>(null);
     const [isClient, setIsClient] = useState(false);
     const hasNavigatedRef = useRef(false);
     const timerRef = useRef<NodeJS.Timeout | null>(null);
     const dispatch = useAppDispatch();
     const queryClient = useQueryClient();

     // Fix hydration mismatch by only showing dynamic content on client
     useEffect(() => {
          setIsClient(true);
     }, []);

     const { data: userData } = useQuery({
          queryKey: ['currentUser'],
          queryFn: authService.getCurrentUser
     });

     const {
          findNextExam,
          areAllExamsCompleted,
          getExamProgress,
          updateExamStatus
     } = useExamFlow();

     const completedExam = React.useMemo(() => {
          if (!userData?.assigned || !currentSlug) return null;
          return findExamBySlug(userData.assigned, currentSlug);
     }, [userData?.assigned, currentSlug]);

     const allExams = React.useMemo(() => {
          return userData?.assigned || [];
     }, [userData?.assigned]);

     const nextExam = React.useMemo(() => {
          if (!isClient || !completedExam || !allExams.length) return null;

          console.log('=== FINDING NEXT EXAM ===');
          console.log('Current completed exam:', {
               id: completedExam.exam_id,
               title: completedExam.title,
               slug: currentSlug
          });
          console.log('All available exams:', allExams.map(e => ({
               id: e.exam_id,
               title: e.title,
               order: allExams.indexOf(e)
          })));

          const next = findNextExam(allExams, completedExam.exam_id);
          console.log('Next exam result:', next ? {
               id: next.exam_id,
               title: next.title,
               duration: next.duration
          } : 'No next exam found');
          console.log('=== END FINDING NEXT EXAM ===');

          return next;
     }, [isClient, completedExam, allExams, findNextExam, currentSlug]);

     const allCompleted = React.useMemo(() => {
          if (!isClient) return false;
          const completed = areAllExamsCompleted(allExams);
          console.log('All exams completed?', completed);
          return completed;
     }, [isClient, allExams, areAllExamsCompleted]);

     const progress = React.useMemo(() => {
          if (!isClient) return { total: 0, completed: 0, inProgress: 0, notStarted: 0 };
          const prog = getExamProgress(allExams);
          console.log('Exam progress:', prog);
          return prog;
     }, [isClient, allExams, getExamProgress]);

     const handleAutoNavigation = useCallback(() => {
          console.log('=== AUTO NAVIGATION TRIGGERED ===');
          console.log('Navigation state check:', {
               hasNavigated: hasNavigatedRef.current,
               isClient,
               isTransitioning,
               nextExam: nextExam ? { id: nextExam.exam_id, title: nextExam.title } : null,
               allCompleted
          });

          if (hasNavigatedRef.current || !isClient) {
               console.log('Navigation blocked - already navigated or not client-side');
               return;
          }

          // Prevent multiple navigation attempts
          hasNavigatedRef.current = true;

          console.log('Exam statuses before navigation:', localStorage.getItem('exam_statuses'));

          // Clear any existing timer
          if (timerRef.current) {
               clearInterval(timerRef.current);
               timerRef.current = null;
          }

          // Set transitioning state
          setIsTransitioning(true);

          // Small delay to ensure state updates
          setTimeout(async () => {
               if (nextExam && !allCompleted) {
                    const nextExamSlug = createExamSlug(nextExam.title);
                    console.log('🚀 NAVIGATING TO NEXT EXAM:', {
                         from: currentSlug,
                         to: nextExamSlug,
                         examId: nextExam.exam_id,
                         examTitle: nextExam.title,
                         examSlug: nextExamSlug
                    });

                    // Reset Redux state completely
                    dispatch(resetExamState());

                    // Clear React Query cache
                    queryClient.removeQueries({ queryKey: ['exam'] });
                    queryClient.removeQueries({ queryKey: ['session'] });
                    queryClient.removeQueries({ queryKey: ['examData'] });

                    // Clear previous exam data from localStorage
                    localStorage.removeItem('exam_result');
                    localStorage.removeItem('session_token');
                    localStorage.removeItem('session_id');

                    // Set new exam data for next exam
                    localStorage.setItem('exam_id', nextExam.exam_id.toString());
                    localStorage.setItem('exam_duration', nextExam.duration.toString());
                    localStorage.setItem('current_exam_slug', nextExamSlug);

                    console.log('New localStorage state:', {
                         exam_id: localStorage.getItem('exam_id'),
                         exam_duration: localStorage.getItem('exam_duration'),
                         current_exam_slug: localStorage.getItem('current_exam_slug')
                    });

                    // Navigate to next exam
                    router.push(`/exam/${nextExamSlug}`);
               } else {
                    console.log('🏁 ALL EXAMS COMPLETED - clearing all sessions and navigating to dashboard');

                    // Clear all exam sessions when all exams are completed
                    await examService.clearAllExamSessions();

                    console.log('✅ All sessions cleared - redirecting to dashboard');
                    router.push('/dashboard');
               }
          }, 200);
     }, [nextExam, router, currentSlug, dispatch, queryClient, isClient, allCompleted, isTransitioning]);

     useEffect(() => {
          if (!isClient) return;

          console.log('=== COMPLETE PAGE EFFECT STARTING ===');
          console.log('Current state:', {
               isClient,
               currentSlug,
               completedExam: completedExam ? { id: completedExam.exam_id, title: completedExam.title } : null,
               hasNavigated: hasNavigatedRef.current
          });

          // Load exam result from localStorage
          const storedResult = localStorage.getItem('exam_result');
          if (storedResult) {
               try {
                    const result = JSON.parse(storedResult);
                    setExamResult(result);
                    console.log('Loaded exam result:', result.exam_title);
               } catch (error) {
                    console.error('Failed to parse exam result:', error);
               }
          }

          // Ensure current exam is marked as completed
          if (completedExam) {
               console.log('Marking exam as completed:', {
                    examId: completedExam.exam_id,
                    examTitle: completedExam.title
               });
               updateExamStatus(completedExam.exam_id, 'completed');
          }

          // Clean up exam-related localStorage items from previous exam
          localStorage.removeItem('current_exam_slug');
          localStorage.removeItem('session_token');

          // Set up auto navigation timer - only start if not already navigated
          if (!hasNavigatedRef.current) {
               console.log('Setting up auto navigation timer - countdown from 5 seconds');
               timerRef.current = setInterval(() => {
                    setCountdown(prev => {
                         console.log('Countdown:', prev);
                         if (prev <= 1) {
                              console.log('Countdown finished - triggering navigation');
                              if (timerRef.current) {
                                   clearInterval(timerRef.current);
                                   timerRef.current = null;
                              }
                              // Use setTimeout to avoid setState during render
                              setTimeout(() => {
                                   console.log('Executing auto navigation');
                                   handleAutoNavigation();
                              }, 100);
                              return 0;
                         }
                         return prev - 1;
                    });
               }, 1000);
          } else {
               console.log('Navigation already triggered - skipping timer setup');
          }

          return () => {
               console.log('Complete page effect cleanup');
               if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
               }
               localStorage.removeItem('session_token');
          };
     }, [handleAutoNavigation, isClient, completedExam, updateExamStatus, currentSlug]);

     const handleManualNavigation = () => {
          console.log('=== MANUAL NAVIGATION TRIGGERED ===');
          if (hasNavigatedRef.current || !isClient) {
               console.log('Manual navigation blocked');
               return;
          }

          // Prevent multiple clicks
          hasNavigatedRef.current = true;

          // Clear timer
          if (timerRef.current) {
               clearInterval(timerRef.current);
               timerRef.current = null;
          }

          console.log('🚀 MANUAL NAVIGATION - same logic as auto navigation');
          handleAutoNavigation();
     };

     const handleBackToDashboard = () => {
          router.push('/dashboard');
     };

     if (isTransitioning) {
          return (
               <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                         <Card className="max-w-md w-full p-8 text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                   {nextExam ? 'Memuat Ujian Berikutnya...' : 'Kembali ke Dashboard...'}
                              </h2>
                              <p className="text-gray-600">
                                   {nextExam ? `Menuju ujian: ${nextExam.title}` : 'Semua ujian telah selesai!'}
                              </p>
                         </Card>
                    </div>
               </ProtectedRoute>
          );
     }

     if (!isClient) {
          return (
               <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                         <Card className="max-w-md w-full p-8 text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                   Memuat...
                              </h2>
                         </Card>
                    </div>
               </ProtectedRoute>
          );
     }

     return (
          <ProtectedRoute>
               <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
                    <Card className="max-w-2xl w-full p-8 text-center shadow-lg">
                         <div className="flex justify-center mb-6">
                              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                   <CheckCircle className="w-12 h-12 text-green-600" />
                              </div>
                         </div>

                         <h1 className="text-3xl font-bold text-gray-800 mb-4">
                              Ujian Selesai!
                         </h1>

                         <p className="text-lg text-gray-600 mb-8">
                              Selamat! Anda telah berhasil menyelesaikan ujian.
                              Jawaban Anda telah tersimpan dengan aman.
                         </p>

                         {examResult && (
                              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                                   <h3 className="font-semibold text-blue-800 mb-4 text-center">Hasil Ujian</h3>
                                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="text-center">
                                             <div className="text-2xl font-bold text-blue-600">{examResult.total_score}</div>
                                             <div className="text-sm text-blue-700">Skor Total</div>
                                        </div>
                                        <div className="text-center">
                                             <div className="text-2xl font-bold text-green-600">{examResult.percentage?.toFixed(1)}%</div>
                                             <div className="text-sm text-green-700">Persentase</div>
                                        </div>
                                        <div className="text-center">
                                             <div className="text-2xl font-bold text-purple-600">{examResult.grade.letter}</div>
                                             <div className="text-sm text-purple-700">Letter</div>
                                        </div>
                                        <div className="text-center">
                                             <div className="text-2xl font-bold text-purple-600">{examResult.grade.description}</div>
                                             <div className="text-sm text-purple-700">Deskripsi</div>
                                        </div>
                                        <div className="text-center">
                                             <div className="text-2xl font-bold text-orange-600">
                                                  {examResult.answered_questions}/{examResult.total_questions}
                                             </div>
                                             <div className="text-sm text-orange-700">Terjawab</div>
                                        </div>
                                   </div>
                                   {examResult.score_breakdown && (
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                             <div className="bg-white rounded p-3 text-center">
                                                  <div className="font-medium text-gray-800">Multiple Choice</div>
                                                  <div className="text-lg font-bold text-blue-600">{examResult.score_breakdown.multiple_choice.score}</div>
                                             </div>
                                             <div className="bg-white rounded p-3 text-center">
                                                  <div className="font-medium text-gray-800">Essay</div>
                                                  <div className="text-lg font-bold text-green-600">{examResult.score_breakdown.essay.score}</div>
                                             </div>
                                        </div>
                                   )}
                              </div>
                         )}

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                              <Card className="p-4 bg-green-50 border-green-200">
                                   <div className="flex items-center justify-center mb-2">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                   </div>
                                   <h3 className="font-semibold text-gray-800">Status</h3>
                                   <p className="text-sm text-gray-600">Berhasil Dikirim</p>
                              </Card>

                              <Card className="p-4 bg-blue-50 border-blue-200">
                                   <div className="flex items-center justify-center mb-2">
                                        <Clock className="w-8 h-8 text-blue-600" />
                                   </div>
                                   <h3 className="font-semibold text-gray-800">Waktu Selesai</h3>
                                   <p className="text-sm text-gray-600">
                                        {isClient && (examResult?.submission_time
                                             ? new Date(examResult.submission_time).toLocaleString('id-ID')
                                             : new Date().toLocaleString('id-ID')
                                        )}
                                   </p>
                              </Card>

                              <Card className="p-4 bg-purple-50 border-purple-200">
                                   <div className="flex items-center justify-center mb-2">
                                        <FileText className="w-8 h-8 text-purple-600" />
                                   </div>
                                   <h3 className="font-semibold text-gray-800">Progress Ujian</h3>
                                   <p className="text-sm text-gray-600">
                                        {progress.completed}/{progress.total} Selesai
                                   </p>
                              </Card>
                         </div>

                         {nextExam && !allCompleted ? (
                              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                                   <h3 className="font-semibold text-blue-800 mb-3 flex items-center justify-center gap-2">
                                        <ArrowRight className="w-5 h-5" />
                                        Ujian Berikutnya
                                   </h3>
                                   <p className="text-blue-700 mb-3 font-medium">{nextExam.title}</p>
                                   <div className="flex justify-center gap-4 text-sm text-blue-600 mb-4">
                                        <span>{nextExam.duration} menit</span>
                                        <span>•</span>
                                        <span>{nextExam.total_quest} soal</span>
                                   </div>
                                   <p className="text-sm text-blue-700">
                                        {isClient && `Anda akan otomatis diarahkan ke ujian berikutnya dalam ${countdown} detik`}
                                   </p>
                              </div>
                         ) : (
                              <div className="bg-green-50 rounded-lg p-6 mb-8">
                                   <h3 className="font-semibold text-green-800 mb-3">
                                        🎉 Semua Ujian Selesai!
                                   </h3>
                                   <p className="text-green-700 mb-3">
                                        Selamat! Anda telah menyelesaikan semua ujian yang ditugaskan.
                                   </p>
                                   <p className="text-sm text-green-700">
                                        {isClient && `Anda akan otomatis diarahkan ke dashboard dalam ${countdown} detik`}
                                   </p>
                              </div>
                         )}

                         <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                              <h3 className="font-semibold text-gray-800 mb-3">Informasi Penting:</h3>
                              <ul className="space-y-2 text-sm text-gray-700">
                                   <li>• Hasil ujian akan diumumkan sesuai dengan jadwal yang telah ditentukan</li>
                                   <li>• Anda dapat melihat hasil ujian melalui dashboard setelah diumumkan</li>
                                   <li>• Jika ada pertanyaan, silakan hubungi pengawas ujian</li>
                                   <li>• Terima kasih telah mengikuti ujian dengan tertib</li>
                              </ul>
                         </div>

                         <div className="flex flex-col sm:flex-row gap-4 justify-center">
                              <Button
                                   variant="outline"
                                   onClick={handleBackToDashboard}
                                   className="flex items-center gap-2"
                              >
                                   <Home className="w-4 h-4" />
                                   Kembali ke Dashboard
                              </Button>

                              {nextExam && !allCompleted && (
                                   <Button
                                        onClick={handleManualNavigation}
                                        className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                                   >
                                        <ArrowRight className="w-4 h-4" />
                                        Lanjut ke Ujian Berikutnya
                                   </Button>
                              )}
                         </div>
                    </Card>
               </div>
          </ProtectedRoute>
     );
}
