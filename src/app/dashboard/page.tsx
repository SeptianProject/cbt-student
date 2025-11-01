'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User, GraduationCap, MapPin, Calendar, School, IdCard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useExamFlow } from '@/hooks/useExamFlow'
import { createExamSlug } from '@/lib/examUtils'
import { useCurrentUser } from '@/hooks/useAuthQuery'
import { useAppSelector } from '@/store/hooks'

const DashboardPage = () => {
  const router = useRouter()
  const [isCheckingNextExam, setIsCheckingNextExam] = useState(false)
  const [nextExamFound, setNextExamFound] = useState(false)

  // Redux state untuk auth
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  // React Query untuk fetch dashboard data
  const { data: userData, isLoading, error } = useCurrentUser(isAuthenticated)

  const { findNextExam, areAllExamsCompleted } = useExamFlow()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatGender = (gender: string) => {
    return gender === 'L' ? 'Laki-laki' : 'Perempuan'
  }

  useEffect(() => {
    if (userData?.assigned && userData.assigned.length > 0) {
      setIsCheckingNextExam(true)

      setTimeout(() => {
        const allExams = userData.assigned
        const allCompleted = areAllExamsCompleted(allExams)

        if (!allCompleted) {
          const nextExam = findNextExam(allExams)
          if (nextExam) {
            setNextExamFound(true)
            const nextExamSlug = createExamSlug(nextExam.title)

            localStorage.setItem('exam_id', nextExam.exam_id.toString())
            localStorage.setItem('exam_duration', nextExam.duration.toString())
            localStorage.setItem('current_exam_slug', nextExamSlug)

            // Auto redirect to next exam after short delay
            setTimeout(() => {
              router.push(`/exam/${nextExamSlug}`)
            }, 1500) // 1.5 second delay to show transition
          }
        } else {
          console.info('All exams completed - staying on dashboard')
        }
        setIsCheckingNextExam(false)
      }, 1000)
    }
  }, [userData, findNextExam, areAllExamsCompleted, router])

  const handleContinue = () => {
    router.push('/exam')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <p className="text-red-600">Ada kesalahan, mohon coba lagi.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex flex-col items-center justify-center p-4">
      {userData?.success && (
        <Card className="max-w-2xl w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* NIS Badge */}
            <div className="text-center mb-6">
              <div className="inline-block bg-primary/10 rounded-lg px-4 py-2">
                <p className="text-lg text-primary font-semibold">NIS: {userData.student?.nis}</p>
              </div>
            </div>

            {/* Detail Biodata */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                  <IdCard className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Nama Lengkap</p>
                    <p className="font-semibold text-gray-800">{userData.student?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                  <User className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Jenis Kelamin</p>
                    <p className="font-semibold text-gray-800">{formatGender(userData.student?.gender || '')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                  <GraduationCap className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Kelas</p>
                    <p className="font-semibold text-gray-800">Kelas {userData.student?.grade_id}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Tempat, Tanggal Lahir</p>
                    <p className="font-semibold text-gray-800">
                      {userData.student?.p_birth}, {userData.student?.d_birth && formatDate(userData.student.d_birth)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Alamat</p>
                    <p className="font-semibold text-gray-800">{userData.student?.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                  <School className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Sekolah</p>
                    <p className="font-semibold text-gray-800">{userData.student?.school?.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 max-w-md w-full">
        {isCheckingNextExam ? (
          <Card className="p-4 text-center bg-blue-50 border-blue-200">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 font-medium">Memeriksa ujian berikutnya...</span>
            </div>
          </Card>
        ) : nextExamFound ? (
          <Card className="p-4 text-center bg-green-50 border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ArrowRight className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Mengarahkan ke ujian berikutnya...</span>
            </div>
            <p className="text-sm text-green-600">Silakan tunggu sebentar</p>
          </Card>
        ) : (
          <Button variant="default" onClick={handleContinue} className='w-full text-base font-semibold'>
            Lanjutkan ke Ujian
          </Button>
        )}
      </div>
    </div>
  )
}

export default DashboardPage