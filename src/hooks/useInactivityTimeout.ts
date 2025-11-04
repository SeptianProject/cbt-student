import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuth } from '@/store/authSlice';

interface UseInactivityTimeoutOptions {
     timeout?: number; // in milliseconds
     onTimeout?: () => void;
     excludeRoutes?: string[]; // routes to exclude from timeout
}

/**
 * Hook untuk menangani inactivity timeout
 * Default: 1 menit untuk testing
 * Akan logout user jika tidak ada aktivitas dalam waktu yang ditentukan
 */
export function useInactivityTimeout(options: UseInactivityTimeoutOptions = {}) {
     const {
          timeout = 1 * 60 * 1000, // 1 menit untuk testing
          onTimeout,
          excludeRoutes = ['/exam'], // exclude exam pages by default
     } = options;

     const router = useRouter();
     const dispatch = useAppDispatch();
     const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
     const timeoutRef = useRef<NodeJS.Timeout | null>(null);
     const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
     const isActiveRef = useRef(true);
     const hasLoggedOutRef = useRef(false);

     // Function to handle timeout
     const handleTimeout = useCallback(async () => {
          // Prevent multiple logout calls
          if (hasLoggedOutRef.current) {
               return;
          }

          hasLoggedOutRef.current = true;

          console.log('⏰ INACTIVITY TIMEOUT - AUTO LOGOUT');
          console.log('🔴 Logging out user and clearing all sessions...');

          // Clear countdown interval if exists
          if (countdownIntervalRef.current) {
               clearInterval(countdownIntervalRef.current);
               countdownIntervalRef.current = null;
          }

          // Clear timeout ref
          if (timeoutRef.current) {
               clearTimeout(timeoutRef.current);
               timeoutRef.current = null;
          }

          // Clear auth state from Redux
          dispatch(clearAuth());
          console.log('✅ Redux auth state cleared');

          // Logout and clear sessions from backend
          try {
               await authService.logout();
               console.log('✅ Backend session cleared');
          } catch (error) {
               console.error('❌ Error during logout:', error);
          }

          // Clear localStorage
          if (typeof window !== 'undefined') {
               localStorage.removeItem('token');
               localStorage.removeItem('user');
               localStorage.removeItem('sessionId');
               console.log('✅ LocalStorage cleared');
          }

          // Call custom onTimeout if provided
          if (onTimeout) {
               onTimeout();
          }

          // Redirect to login
          console.log('🔄 Redirecting to login page...');
          router.push('/');
     }, [dispatch, router, onTimeout]);

     // Function to reset timer
     const resetTimer = useCallback(() => {
          // Prevent reset if already logged out
          if (hasLoggedOutRef.current) {
               return;
          }

          // Check if current route should be excluded
          if (typeof window !== 'undefined') {
               const currentPath = window.location.pathname;
               const shouldExclude = excludeRoutes.some(route =>
                    currentPath.startsWith(route)
               );

               if (shouldExclude) {
                    // Don't set timeout for excluded routes
                    if (timeoutRef.current) {
                         clearTimeout(timeoutRef.current);
                         timeoutRef.current = null;
                    }
                    if (countdownIntervalRef.current) {
                         clearInterval(countdownIntervalRef.current);
                         countdownIntervalRef.current = null;
                    }
                    return;
               }
          }

          // Clear existing timeouts
          if (timeoutRef.current) {
               clearTimeout(timeoutRef.current);
          }
          if (countdownIntervalRef.current) {
               clearInterval(countdownIntervalRef.current);
               countdownIntervalRef.current = null;
          }

          // Log timer reset
          const timeoutSeconds = Math.floor(timeout / 1000);
          console.log(`🔄 Timer reset - Next timeout in ${timeoutSeconds} seconds (${Math.floor(timeoutSeconds / 60)}m ${timeoutSeconds % 60}s)`);

          // Start countdown logging every 10 seconds
          let elapsedSeconds = 0;
          countdownIntervalRef.current = setInterval(() => {
               elapsedSeconds += 10;
               const remainingSeconds = timeoutSeconds - elapsedSeconds;

               if (remainingSeconds > 0) {
                    const minutes = Math.floor(remainingSeconds / 60);
                    const seconds = remainingSeconds % 60;
                    console.log(`⏳ Time until logout: ${minutes}m ${seconds}s`);
               }
          }, 10000); // Log every 10 seconds

          // Set final timeout - langsung logout tanpa warning
          timeoutRef.current = setTimeout(() => {
               if (isActiveRef.current) {
                    handleTimeout();
               }
          }, timeout);
     }, [timeout, handleTimeout, excludeRoutes]);

     // Setup event listeners
     useEffect(() => {
          // Only enable timeout if user is authenticated
          if (!isAuthenticated) {
               console.log('🔓 Inactivity timeout disabled - user not authenticated');
               return;
          }

          // Check if we're on an excluded route
          if (typeof window !== 'undefined') {
               const currentPath = window.location.pathname;
               const shouldExclude = excludeRoutes.some(route =>
                    currentPath.startsWith(route)
               );

               if (shouldExclude) {
                    console.log('🔓 Inactivity timeout disabled for:', currentPath);
                    return;
               }
          }

          console.log('🔒 Inactivity timeout enabled - timeout:', timeout / 1000, 'seconds');

          // List of events that indicate user activity
          // Note: mousemove removed to prevent too many resets
          const events = [
               'mousedown',
               'keypress',
               'scroll',
               'touchstart',
               'click',
          ];

          // Debounce timer reset to prevent too frequent resets
          let debounceTimer: NodeJS.Timeout | null = null;

          // Reset timer on any activity (with debounce)
          const handleActivity = () => {
               if (debounceTimer) {
                    clearTimeout(debounceTimer);
               }

               debounceTimer = setTimeout(() => {
                    resetTimer();
               }, 1000); // Debounce 1 second
          };

          // Add event listeners
          events.forEach(event => {
               window.addEventListener(event, handleActivity);
          });

          // Start initial timer
          resetTimer();

          // Cleanup
          return () => {
               if (debounceTimer) {
                    clearTimeout(debounceTimer);
               }
               if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
               }
               if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
               }
               events.forEach(event => {
                    window.removeEventListener(event, handleActivity);
               });
          };
     }, [timeout, excludeRoutes, handleTimeout, resetTimer, isAuthenticated]);

     // Cleanup on unmount
     useEffect(() => {
          isActiveRef.current = true;

          return () => {
               isActiveRef.current = false;
               hasLoggedOutRef.current = false;
               if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
               }
               if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
               }
          };
     }, []);

     // Reset logout flag when user logs in
     useEffect(() => {
          if (isAuthenticated && hasLoggedOutRef.current) {
               console.log('🔓 User logged in - resetting logout flag and restarting timer');
               hasLoggedOutRef.current = false;
               isActiveRef.current = true;
          }
     }, [isAuthenticated]);

     // Return empty object since we don't need to expose anything
     return {};
}
