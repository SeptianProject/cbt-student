import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAppDispatch } from '@/store/hooks';
import { setToken, clearAuth } from '@/store/authSlice';
import { useRouter } from 'next/navigation';

// Query Keys
export const authKeys = {
     all: ['auth'] as const,
     currentUser: () => [...authKeys.all, 'currentUser'] as const,
};

// Hook untuk login
export const useLoginMutation = () => {
     const dispatch = useAppDispatch();
     const queryClient = useQueryClient();
     const router = useRouter();

     return useMutation({
          mutationFn: ({ email, password }: { email: string; password: string }) =>
               authService.login(email, password),
          onSuccess: (data) => {
               // Update Redux state
               dispatch(setToken(data.token));

               // Invalidate and refetch user data
               queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

               router.push('/dashboard');
          },
          onError: (error: Error) => {
               console.error('Login failed:', error.message);
          },
     });
};

// Hook untuk logout
export const useLogoutMutation = () => {
     const dispatch = useAppDispatch();
     const queryClient = useQueryClient();
     const router = useRouter();

     return useMutation({
          mutationFn: () => authService.logout(),
          onSuccess: () => {
               // Clear Redux state
               dispatch(clearAuth());

               // Clear all queries
               queryClient.clear();

               router.push('/');
          },
          onError: (error: Error) => {
               console.error('Logout failed:', error.message);
          },
     });
};

// Hook untuk get current user (Dashboard data)
export const useCurrentUser = (enabled: boolean = true) => {
     return useQuery({
          queryKey: authKeys.currentUser(),
          queryFn: () => authService.getCurrentUser(),
          enabled, // Only fetch when enabled (e.g., when user is authenticated)
          staleTime: 0, // Always fetch fresh data to ensure latest assigned exams
          refetchOnMount: 'always', // Always refetch when component mounts
     });
};
