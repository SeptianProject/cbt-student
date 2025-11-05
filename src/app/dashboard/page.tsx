'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User, GraduationCap, MapPin, Calendar, School, IdCard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useAuthQuery'
import ProtectedRoute from '@/components/ProtectedRoute'
import { LogoutButton } from '@/components/LogoutButton'

const DashboardPage = () => {
  const router = useRouter()
  const [hasToken, setHasToken] = useState(false)

  // Check if token exists in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('api_token')
      setHasToken(!!token)
    }
  }, [])

  const { data: userData, isLoading, error } = useCurrentUser(hasToken)

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

  const handleContinue = () => {
    router.push('/exam')
  }

  return (
    <ProtectedRoute>
      {isLoading && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-6">
              <p className="text-red-600">Ada kesalahan, mohon coba lagi.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !error && (
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

          <div className="mt-6 max-w-md w-full space-y-3">
            {userData?.assigned && userData.assigned.length > 0 && (
              <Button
                variant="default"
                onClick={handleContinue}
                className='w-full text-base font-semibold'
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Lanjutkan ke Ujian
              </Button>
            )}

            <LogoutButton
              variant="outline"
              className='w-full text-base font-semibold border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700'
            />
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}

export default DashboardPage