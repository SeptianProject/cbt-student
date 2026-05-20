import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  Draft,
} from "@reduxjs/toolkit";
import { authService } from "@/services/auth";
import { User, DashboardExam, ExamStatusResponse } from "@/types";

interface AuthState {
  user: User | null;
  dashboardData: DashboardExam | null;
  token: string | null;
  session_token: string | null;
  session_id: number | null;
  is_active: boolean;
  is_logout: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  force_exit: boolean; // Set to true when force-exit happens
}

const readBooleanFlag = (key: string, fallback: boolean) => {
  if (typeof window === "undefined") return fallback;

  const value = localStorage.getItem(key);
  if (value === null) return fallback;

  return value === "1" || value === "true";
};

const initialState: AuthState = {
  user: null,
  dashboardData: null,
  token:
    typeof window !== "undefined" ? localStorage.getItem("api_token") : null,
  session_token:
    typeof window !== "undefined"
      ? localStorage.getItem("session_token")
      : null,
  session_id:
    typeof window !== "undefined"
      ? localStorage.getItem("session_id")
        ? parseInt(localStorage.getItem("session_id")!)
        : null
      : null,
  is_active: readBooleanFlag("user_is_active", false),
  is_logout: readBooleanFlag("user_is_logout", true),
  isAuthenticated: false,
  isLoading: false,
  isError: false,
  errorMessage: null,
  force_exit: false,
};

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }) => {
    const response = await authService.login(email, password);
    return response;
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await authService.logout();
});

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async () => {
    return await authService.getCurrentUser();
  },
);

export const checkExamStatus = createAsyncThunk(
  "auth/examStatus",
  async (examId: number, { rejectWithValue }) => {
    try {
      const response = await authService.examStatus(examId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state: Draft<AuthState>) {
      state.isError = false;
      state.errorMessage = null;
    },
    setToken(state: Draft<AuthState>, action: PayloadAction<string>) {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    setSessionToken(
      state: Draft<AuthState>,
      action: PayloadAction<{ session_token: string; session_id: number }>,
    ) {
      state.session_token = action.payload.session_token;
      state.session_id = action.payload.session_id;
    },
    clearAuth(state: Draft<AuthState>) {
      state.user = null;
      state.dashboardData = null;
      state.token = null;
      state.session_token = null;
      state.session_id = null;
      state.isAuthenticated = false;
      state.is_active = false;
      state.is_logout = true;
      state.force_exit = false;
    },
    setForceExit(state: Draft<AuthState>) {
      state.force_exit = true;
      // Don't change is_active here - it should be controlled by backend state
      // Force exit means is_active=1 && is_logout=1 (per state model)
    },
    clearForceExit(state: Draft<AuthState>) {
      state.force_exit = false;
    },
    updateAuthState(
      state: Draft<AuthState>,
      action: PayloadAction<{ is_active?: boolean; is_logout?: boolean }>,
    ) {
      if (action.payload.is_active !== undefined) {
        state.is_active = action.payload.is_active;
      }

      if (action.payload.is_logout !== undefined) {
        state.is_logout = action.payload.is_logout;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state: Draft<AuthState>) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(
        login.fulfilled,
        (
          state: Draft<AuthState>,
          action: PayloadAction<{ user: User; token: string }>,
        ) => {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.is_active = action.payload.user.is_active;
          state.is_logout = action.payload.user.is_logout || false;
          state.isAuthenticated = true;
          state.isLoading = false;
        },
      )
      .addCase(
        login.rejected,
        (state: Draft<AuthState>, action: { error: { message?: string } }) => {
          state.isLoading = false;
          state.isError = true;
          state.errorMessage = action.error?.message || "Login failed";
        },
      )
      // Logout
      .addCase(logout.pending, (state: Draft<AuthState>) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state: Draft<AuthState>) => {
        state.user = null;
        state.dashboardData = null;
        state.token = null;
        state.session_token = null;
        state.session_id = null;
        state.isAuthenticated = false;
        state.is_active = false;
        state.is_logout = true;
        state.isLoading = false;
      })
      .addCase(logout.rejected, (state: Draft<AuthState>) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = "Logout failed";
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state: Draft<AuthState>) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(
        getCurrentUser.fulfilled,
        (state: Draft<AuthState>, action: PayloadAction<DashboardExam>) => {
          state.dashboardData = action.payload;
          if (action.payload.student?.user) {
            state.is_active = action.payload.student.user.is_active;
            state.is_logout = action.payload.student.user.is_logout || false;
          }
          state.isAuthenticated = true;
          state.isLoading = false;
        },
      )
      .addCase(
        getCurrentUser.rejected,
        (state: Draft<AuthState>, action: { error: { message?: string } }) => {
          state.isLoading = false;
          state.isError = true;
          state.errorMessage =
            action.error?.message || "Failed to get user data";
          state.isAuthenticated = false;
        },
      )
      // Exam Status
      .addCase(
        checkExamStatus.fulfilled,
        (
          state: Draft<AuthState>,
          action: PayloadAction<ExamStatusResponse>,
        ) => {
          state.is_active = action.payload.is_active;
          state.is_logout = action.payload.is_logout;
        },
      );
  },
});

export const {
  clearError,
  setToken,
  setSessionToken,
  clearAuth,
  setForceExit,
  clearForceExit,
  updateAuthState,
} = authSlice.actions;

export default authSlice.reducer;
