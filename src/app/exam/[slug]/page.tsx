'use client'

import Content from '@/components/exam/ExamContent'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SessionErrorHandler } from '@/components/exam/SessionErrorHandler'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/auth'
import { examService } from '@/services/exam'
import { findExamBySlug } from '@/lib/examUtils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { useAppDispatch } from '@/store/hooks'
import { resetExamState } from '@/store/examSlice'
import React from 'react'

export default function ExamDetailPage() {
     const router = useRouter();
     const params = useParams();
     const slug = params.slug as string;
     const dispatch = useAppDispatch();
     const [confirmed, setConfirmed] = React.useState(false);
     const [showSessionError, setShowSessionError] = React.useState(false);

     const { data: userData } = useQuery({
          queryKey: ['currentUser'],
          queryFn: () => authService.getCurrentUser(),
     })

     React.useEffect(() => {
          dispatch(resetExamState());

          // Only clear exam_result, keep session_token for potential reuse
          localStorage.removeItem('exam_result');
     }, [dispatch, slug]);

     const currentExam = React.useMemo(() => {
          if (!userData?.assigned || !slug) return null;
          return findExamBySlug(userData.assigned, slug);
     }, [userData?.assigned, slug]);

     const examMutation = useMutation({
          mutationFn: () => {
               if (!currentExam) {
                    throw new Error('Exam not found');
               }
               localStorage.setItem('exam_id', currentExam.exam_id.toString());
               localStorage.setItem('exam_duration', currentExam.duration.toString());
               localStorage.setItem('current_exam_slug', slug);

               return examService.examStartSafe(currentExam.exam_id);
          },
          onSuccess: () => {
               setShowSessionError(false);
               router.push(`/exam/${slug}/start`);
          },
          onError: (error) => {
               console.error('Failed to start exam:', error);
               const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

               // Check if it's a session conflict error
               if (axiosError?.response?.status === 422 &&
                    axiosError?.response?.data?.message?.includes('sesi ujian yang aktif')) {
                    setShowSessionError(true);
               } else {
                    const errorMessage = error instanceof Error ? error.message : 'Gagal memulai ujian. Silakan coba lagi.';
                    alert(errorMessage);
               }
          }
     })

     const handleSessionCleared = () => {
          setShowSessionError(false);
          // Retry starting exam after clearing session
          examMutation.mutate();
     }

     const handleConfirm = () => {
          setConfirmed(true);
     }

     const handleStartExam = () => {
          if (!currentExam) {
               alert('Ujian tidak ditemukan. Silakan kembali ke halaman ujian.');
               return;
          }
          examMutation.mutate();
     }

     if (userData?.assigned && !currentExam && slug) {
          return (
               <ProtectedRoute>
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                         <div className="text-center">
                              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ujian Tidak Ditemukan</h2>
                              <p className="text-gray-600 mb-6">
                                   Ujian dengan slug &quot;{slug}&quot; tidak ditemukan. Silakan kembali ke halaman ujian dan pilih ujian yang tersedia.
                              </p>
                              <Button onClick={() => router.push('/exam')}>
                                   Kembali ke Daftar Ujian
                              </Button>
                         </div>
                    </div>
               </ProtectedRoute>
          );
     }

     if (!userData || !currentExam) {
          return (
               <ProtectedRoute>
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                         <div className="text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                              <p className="text-gray-600">Memuat data ujian...</p>
                         </div>
                    </div>
               </ProtectedRoute>
          );
     }

     return (
          <ProtectedRoute>
               <div className="relative flex flex-col justify-between gap-10 p-4 sm:p-8 md:p-10 lg:p-12 min-h-screen bg-white">
                    {confirmed &&
                         <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center z-20'>
                              <div className={`w-96 h-72 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none bg-white rounded-xl shadow-lg flex flex-col items-center justify-between gap-10 z-20 p-5 py-20
                         ${examMutation.isSuccess ? 'scale-0' : 'scale-100'} transition-transform duration-300`}>
                                   <div className=''>
                                        <p className="text-gray-600 text-center">Setelah ujian dimulai, timer akan berjalan otomatis. Pastikan koneksi internet Anda stabil. Mulai ujian sekarang?</p>
                                   </div>
                                   <div className='flex gap-5 items-center justify-center'>
                                        <Button
                                             variant={"default"}
                                             onClick={handleStartExam}>
                                             {examMutation.isPending ? 'Memulai Ujian...' : 'Mulai Ujian'}
                                        </Button>
                                        <Button
                                             variant={"outline"}
                                             onClick={() => setConfirmed(false)}>
                                             Kembali
                                        </Button>
                                   </div>
                              </div>
                              <div className={`bg-black w-full h-full absolute top-0 left-0 select-none ${examMutation.isSuccess ? 'opacity-0 pointer-events-none' : 'opacity-40'}`}></div>
                         </div>
                    }
                    <Content userData={userData} />

                    {showSessionError && currentExam ? (
                         <SessionErrorHandler
                              examId={currentExam.exam_id}
                              onSuccess={handleSessionCleared}
                              onCancel={() => setShowSessionError(false)}
                         />
                    ) : (
                         <div className="flex justify-center">
                              <Button
                                   className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
                                   onClick={handleConfirm}
                                   disabled={examMutation.isPending}>
                                   Mulai Ujian
                              </Button>
                         </div>
                    )}
               </div>
          </ProtectedRoute>
     )
}