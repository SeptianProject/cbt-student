'use client'

import React from 'react';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

interface InactivityTimeoutProviderProps {
     children: React.ReactNode;
     timeout?: number; // in milliseconds
     excludeRoutes?: string[];
}

/**
 * Provider component untuk menangani inactivity timeout
 * Akan otomatis logout user jika tidak ada aktivitas dalam waktu yang ditentukan
 * Kecuali untuk halaman yang di-exclude (default: /exam)
 */
export function InactivityTimeoutProvider({
     children,
     timeout = 1 * 60 * 1000, // 1 menit untuk testing
     excludeRoutes = ['/exam'], // exclude exam pages by default
}: InactivityTimeoutProviderProps) {
     useInactivityTimeout({
          timeout,
          excludeRoutes,
          onTimeout: () => {
          }
     });

     return <>{children}</>;
}
