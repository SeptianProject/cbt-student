'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { AlertTriangle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface InactivityWarningModalProps {
     isOpen: boolean
     remainingTime: number // in seconds
     onContinue: () => void
}

/**
 * Modal untuk memberi peringatan sebelum timeout terjadi
 * Memberi kesempatan user untuk melanjutkan sesi
 */
export function InactivityWarningModal({
     isOpen,
     remainingTime,
     onContinue,
}: InactivityWarningModalProps) {
     const router = useRouter()
     const [countdown, setCountdown] = useState(remainingTime)

     useEffect(() => {
          if (!isOpen) return

          setCountdown(remainingTime)

          const interval = setInterval(() => {
               setCountdown((prev) => {
                    if (prev <= 1) {
                         clearInterval(interval)
                         return 0
                    }
                    return prev - 1
               })
          }, 1000)

          return () => clearInterval(interval)
     }, [isOpen, remainingTime])

     const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60)
          const secs = seconds % 60
          return `${mins}:${secs.toString().padStart(2, '0')}`
     }

     return (
          <Modal isOpen={isOpen} onClose={() => { /* Prevent closing */ }}>
               <div className="text-center p-6">
                    <div className="flex justify-center mb-4">
                         <div className="rounded-full bg-yellow-100 p-3">
                              <AlertTriangle className="h-12 w-12 text-yellow-600" />
                         </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-2 text-gray-900">
                         Peringatan Tidak Aktif
                    </h2>

                    <div className="flex items-center justify-center gap-2 mb-4">
                         <Clock className="h-5 w-5 text-gray-600" />
                         <p className="text-lg font-semibold text-gray-800">
                              Waktu tersisa: <span className="text-red-600">{formatTime(countdown)}</span>
                         </p>
                    </div>

                    <p className="text-gray-600 mb-6">
                         Anda akan otomatis logout karena tidak ada aktivitas.
                         <br />
                         Klik tombol di bawah untuk melanjutkan sesi Anda.
                    </p>

                    <div className="flex gap-3 justify-center">
                         <Button
                              onClick={onContinue}
                              className="px-8"
                              size="lg"
                         >
                              Lanjutkan Sesi
                         </Button>
                         <Button
                              onClick={() => router.push('/')}
                              variant="outline"
                              size="lg"
                         >
                              Logout Sekarang
                         </Button>
                    </div>
               </div>
          </Modal>
     )
}
