'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { examService } from '@/services/exam';

interface LogoutButtonProps {
     variant?: 'default' | 'outline' | 'ghost';
     size?: 'default' | 'sm' | 'lg' | 'icon';
     className?: string;
     showIcon?: boolean;
     showText?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
     variant = 'outline',
     size = 'default',
     className = '',
     showIcon = true,
     showText = true,
}) => {
     const router = useRouter();
     const dispatch = useAppDispatch();
     const [isLoggingOut, setIsLoggingOut] = useState(false);

     const handleLogout = async () => {
          if (isLoggingOut) return;

          try {
               setIsLoggingOut(true);
               await examService.clearAllExamSessions();
               await dispatch(logout()).unwrap();

               router.push('/');
          } catch (error) {
               console.error('Logout error:', error);
               await examService.clearAllExamSessions();
               if (typeof window !== 'undefined') {
                    localStorage.clear();
               }
               router.push('/');
          } finally {
               setIsLoggingOut(false);
          }
     };

     return (
          <Button
               variant={variant}
               size={size}
               onClick={handleLogout}
               disabled={isLoggingOut}
               className={className}
          >
               {showIcon && <LogOut className={`${showText ? 'mr-2' : ''} w-4 h-4`} />}
               {showText && (isLoggingOut ? 'Keluar...' : 'Keluar')}
          </Button>
     );
};
