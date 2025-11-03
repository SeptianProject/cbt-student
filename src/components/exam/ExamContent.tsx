import { Student, AssignedExam } from '@/types';
import React from 'react'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, FileText, Play, Pause, CheckCircle, Home } from 'lucide-react';

interface ExamContentProps {
     userData?: {
          student: Student;
          assigned: AssignedExam[];
     },
}

interface ExamStatus {
     exam_id: number;
     status: 'not_started' | 'in_progress' | 'completed';
     last_accessed?: string;
}

const ExamContent: React.FC<ExamContentProps> = ({ userData }) => {
     const router = useRouter();
     const examId = localStorage.getItem('exam_id')

     const currentExam = React.useMemo(() => {
          if (!examId || !userData?.assigned) return null;
          return userData.assigned.find(exam => exam.exam_id.toString() === examId);
     }, [examId, userData?.assigned]);

     // Get exam statuses
     const getExamStatuses = (): ExamStatus[] => {
          const saved = localStorage.getItem('exam_statuses');
          if (saved) {
               try {
                    return JSON.parse(saved);
               } catch {
                    return [];
               }
          }
          return [];
     };

     const getExamStatus = (examId: number): ExamStatus['status'] => {
          const statuses = getExamStatuses();
          const status = statuses.find(s => s.exam_id === examId);
          return status?.status || 'not_started';
     };

     const getStatusIcon = (status: ExamStatus['status']) => {
          switch (status) {
               case 'not_started':
                    return <Play className="h-5 w-5 text-primary" />;
               case 'in_progress':
                    return <Pause className="h-5 w-5 text-orange-600" />;
               case 'completed':
                    return <CheckCircle className="h-5 w-5 text-blue-500" />;
               default:
                    return <Play className="h-5 w-5 text-gray-400" />;
          }
     };

     const getStatusText = (status: ExamStatus['status']) => {
          switch (status) {
               case 'not_started':
                    return 'Belum Dimulai';
               case 'in_progress':
                    return 'Sedang Berlangsung';
               case 'completed':
                    return 'Selesai';
               default:
                    return 'Belum Dimulai';
          }
     };

     const getStatusColor = (status: ExamStatus['status']) => {
          switch (status) {
               case 'not_started':
                    return 'text-primary bg-primary/10 border-primary/20';
               case 'in_progress':
                    return 'text-orange-600 bg-orange-50 border-orange-200';
               case 'completed':
                    return 'text-green-500 bg-blue-50 border-blue-200';
               default:
                    return 'text-gray-600 bg-gray-50 border-gray-200';
          }
     };

     const handleBackToDashboard = () => {
          router.push('/dashboard');
     };

     React.useEffect(() => {
          console.log('User Data in Content:', userData)
          console.log('Exam ID from localStorage in Content:', examId)
          console.log('Current Exam Data:', currentExam)
     }, [examId, userData, currentExam])

     if (!examId && userData?.assigned && userData.assigned.length > 0) {
          return (
               <div className="flex flex-col items-center justify-center gap-8 flex-1">
                    <div className="text-center">
                         <h2 className="text-2xl font-bold mb-4">Memuat Ujian...</h2>
                         <p className="text-gray-600">Sedang memilih ujian otomatis...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="flex flex-col items-center justify-center gap-8 flex-1">
               {examId && currentExam ? (
                    <>
                         <div className="text-center">
                              {/* <div className="flex items-center justify-center gap-2 mb-4">
                                   {getStatusIcon(getExamStatus(currentExam.exam_id))}
                                   <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(getExamStatus(currentExam.exam_id))}`}>
                                        {getStatusText(getExamStatus(currentExam.exam_id))}
                                   </span>
                              </div> */} 

                              <h2 className="text-3xl font-bold mb-6">
                                   {currentExam.title}
                              </h2>
                              <div className="flex justify-center gap-8 mb-8">
                                   <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                             <Clock className="h-6 w-6 text-primary" />
                                             <p className="text-3xl font-bold text-primary">
                                                  {currentExam.duration}
                                             </p>
                                        </div>
                                        <p className="text-sm text-gray-600">Menit</p>
                                   </div>
                                   <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                             <FileText className="h-6 w-6 text-blue-500" />
                                             <p className="text-3xl font-bold text-blue-500">
                                                  {currentExam.total_quest}
                                             </p>
                                        </div>
                                        <p className="text-sm text-gray-600">Soal</p>
                                   </div>
                              </div>
                         </div>

                         <div className="text-center max-w-md">
                              <p className="text-gray-600 mb-6">
                                   {getExamStatus(currentExam.exam_id) === 'completed'
                                        ? 'Ujian ini telah selesai dikerjakan. Anda dapat meninjau ulang atau melanjutkan ke ujian berikutnya.'
                                        : 'Pastikan koneksi internet Anda stabil sebelum memulai ujian. Setelah ujian dimulai, timer akan berjalan otomatis.'
                                   }
                              </p>

                              {/* Information */}
                              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                                   <p className="text-sm text-blue-800 mb-2">
                                        <strong>Petunjuk:</strong>
                                   </p>
                                   <ul className="text-sm text-blue-700 space-y-1 text-left">
                                        <li>• Pastikan koneksi internet stabil sebelum memulai ujian</li>
                                        <li>• Setelah ujian dimulai, timer akan berjalan otomatis</li>
                                        <li>• Ujian akan otomatis berakhir ketika waktu habis</li>
                                        <li>• Pastikan Anda telah siap sebelum memulai ujian</li>
                                   </ul>
                              </div>

                              {/* Navigation Button */}
                              {/* <Button
                                   variant="outline"
                                   onClick={handleBackToDashboard}
                                   className="mb-4 flex items-center gap-2"
                              >
                                   <Home className="w-4 h-4" />
                                   Kembali ke Dashboard
                              </Button> */}
                         </div>

                         {/* All Exams Progress */}
                         {/* {userData?.assigned && userData.assigned.length > 1 && (
                              <div className="w-full max-w-4xl">
                                   <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                                        Progress Semua Ujian
                                   </h3>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {userData.assigned.map((exam, index) => {
                                             const status = getExamStatus(exam.exam_id);
                                             const isCurrentExam = examId === exam.exam_id.toString();
                                             return (
                                                  <Card key={exam.exam_id} className={`p-4 transition-all ${isCurrentExam ? 'bg-primary/10 border-primary' : 'hover:shadow-md'
                                                       }`}>
                                                       <div className="flex items-start gap-3">
                                                            <BookOpen className="h-5 w-5 text-primary mt-1" />
                                                            <div className="flex-1">
                                                                 <div className="flex items-center gap-2 mb-2">
                                                                      <span className="text-sm font-medium text-gray-500">
                                                                           #{index + 1}
                                                                      </span>
                                                                      {getStatusIcon(status)}
                                                                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
                                                                           {getStatusText(status)}
                                                                      </span>
                                                                      {isCurrentExam && (
                                                                           <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                                                                                Aktif
                                                                           </span>
                                                                      )}
                                                                 </div>

                                                                 <h4 className="font-medium text-gray-800 mb-2">
                                                                      {exam.title}
                                                                 </h4>
                                                                 <div className="flex gap-4 text-sm text-gray-600">
                                                                      <div className="flex items-center gap-1">
                                                                           <Clock className="h-4 w-4" />
                                                                           {exam.duration} menit
                                                                      </div>
                                                                      <div className="flex items-center gap-1">
                                                                           <FileText className="h-4 w-4" />
                                                                           {exam.total_quest} soal
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  </Card>
                                             );
                                        })}
                                   </div>
                              </div>
                         )} */}
                    </>
               ) : (
                    <div className="text-center">
                         <h2 className="text-2xl font-bold mb-4">
                              {examId ? 'Ujian Tidak Ditemukan' : 'Selamat Datang!'}
                         </h2>
                         <p className="text-gray-600 mb-6">
                              {examId ?
                                   'Ujian yang Anda pilih tidak ditemukan atau sudah tidak tersedia.' :
                                   'Saat ini tidak ada ujian yang ditugaskan untuk Anda.'
                              }
                         </p>
                         <Button
                              onClick={handleBackToDashboard}
                              className="flex items-center gap-2"
                         >
                              <Home className="w-4 h-4" />
                              Kembali ke Dashboard
                         </Button>
                    </div>
               )}
          </div>
     )
}

export default ExamContent