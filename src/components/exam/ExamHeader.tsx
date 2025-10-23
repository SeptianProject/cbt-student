'use client'

import { Student, AssignedExam } from '@/types'
import Image from 'next/image'
import React from 'react'
import { SaveStatusIndicator } from './SaveStatusIndicator'

interface ExamHeaderProps {
     userData?: {
          student: Student;
          assigned: AssignedExam[];
     }
     isSaving?: boolean;
     lastSavedTime?: Date | null;
     saveError?: string | null;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
     userData,
     isSaving = false,
     lastSavedTime = null,
     saveError = null
}) => {
     const examId = localStorage.getItem('exam_id')

     // Cari data exam yang sesuai dengan exam_id yang disimpan
     const currentExam = React.useMemo(() => {
          if (!examId || !userData?.assigned) return null;
          return userData.assigned.find(exam => exam.exam_id.toString() === examId);
     }, [examId, userData?.assigned]);

     return (
          <div className="flex items-center justify-between">
               {/* Left */}
               <div className="flex items-center gap-5">
                    <Image
                         src="https://images.unsplash.com/photo-1534528741775-53994a69daeb"
                         alt="User Avatar"
                         width={500}
                         height={300}
                         className="rounded-full w-20 h-20 object-cover"
                    />
                    <div>
                         <h3 className='text-xl font-semibold'>
                              {userData?.student.name || 'Memuat...'}
                         </h3>
                         <p className='text-sm font-medium text-[#404040]'>
                              Kelas {userData?.student.grade_id || 'Memuat...'}
                         </p>
                    </div>
               </div>
               {/* Right */}
               <div className='flex items-center gap-5'>
                    <div className='flex flex-col items-end gap-2'>
                         {currentExam && (
                              <div className='flex flex-col text-right'>
                                   <h4 className='font-semibold text-lg text-[#404040]'>
                                        {currentExam.title}
                                   </h4>
                                   <p className='text-sm text-[#404040]'>
                                        {currentExam.duration} menit • {currentExam.total_quest} soal
                                   </p>
                              </div>
                         )}
                         {/* Save Status Indicator */}
                         <SaveStatusIndicator
                              isSaving={isSaving}
                              lastSavedTime={lastSavedTime}
                              saveError={saveError}
                         />
                    </div>
                    {/* <button onClick={handleLogoutClick} className='cursor-pointer'>
                                             <RxDashboard className='w-8 h-8 text-[#404040]' />
                                        </button> */}
               </div>
          </div>
     )
}

export default ExamHeader