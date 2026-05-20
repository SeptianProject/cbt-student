import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setToken, clearAuth, updateAuthState } from "@/store/authSlice";
import { useRouter } from "next/navigation";

// Query Keys
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "currentUser"] as const,
};

// Hook untuk login
export const useLoginMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      try {
        return await authService.login(email, password);
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          throw new Error(
            "Akun Anda terkunci. Hubungi pengawas untuk membuka kunci.",
          );
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Save user state from login response
      if (data.user.is_active !== undefined) {
        dispatch(
          updateAuthState({
            is_active: data.user.is_active,
            is_logout: data.user.is_logout || false,
          }),
        );
      }

      // Update Redux state with token
      dispatch(setToken(data.token));

      // Save user state to localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("user_is_active", data.user.is_active ? "1" : "0");
        localStorage.setItem(
          "user_is_logout",
          data.user.is_logout || false ? "1" : "0",
        );
      }

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

      router.push("/dashboard");
    },
    onError: () => {
      // Error will be shown in the UI via mutation error state
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

      // Clear localStorage user state
      if (typeof window !== "undefined") {
        localStorage.removeItem("user_is_active");
        localStorage.removeItem("user_is_logout");
      }

      router.push("/");
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error.message);
    },
  });
};

// Hook untuk get current user (Dashboard data)
export const useCurrentUser = (enabled: boolean = true) => {
  const dispatch = useAppDispatch();
  const query = useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    enabled, // Only fetch when enabled (e.g., when user is authenticated)
    staleTime: 0, // Always fetch fresh data to ensure latest assigned exams
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: false,
    // Disable automatic retries to avoid retry loops on 4xx errors (403 locked account)
    retry: false,
  });

  useEffect(() => {
    const user = query.data?.student?.user;

    if (!user) return;

    dispatch(
      updateAuthState({
        is_active: user.is_active,
        is_logout: user.is_logout || false,
      }),
    );

    if (typeof window !== "undefined") {
      localStorage.setItem("user_is_active", user.is_active ? "1" : "0");
      localStorage.setItem(
        "user_is_logout",
        user.is_logout || false ? "1" : "0",
      );
    }
  }, [dispatch, query.data]);

  return query;
};
