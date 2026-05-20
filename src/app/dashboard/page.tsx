"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuthQuery";
import { useAuthStateProtection } from "@/hooks/useAuthStateProtection";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StudentInfoCard } from "@/components/dashboard/StudentInfoCard";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { Lock } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { clearForceExit, updateAuthState } from "@/store/authSlice";

const DashboardPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [hasToken, setHasToken] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !!localStorage.getItem("api_token");
  });

  // Check if token exists in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("api_token");
      setHasToken(!!token);
    }
  }, []);

  const {
    data: userData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useCurrentUser(hasToken);
  const { is_active, is_logout, force_exit } = useAuthStateProtection();

  // Prefer latest flags from API (`userData`) when available to avoid
  // transient locked state before Redux is updated.
  const apiUser = userData?.student?.user;
  const effectiveIsActive = apiUser?.is_active ?? is_active;
  const effectiveIsLogout = apiUser?.is_logout ?? is_logout;

  const effectiveCanAccessExam =
    force_exit !== true &&
    effectiveIsActive === true &&
    effectiveIsLogout === false;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatGender = (gender: string) => {
    return gender === "L" ? "Laki-laki" : "Perempuan";
  };

  const handleCheckStatus = async () => {
    const result = await refetch();
    const apiUser = result.data?.student?.user;

    if (apiUser?.is_active && !apiUser?.is_logout) {
      localStorage.removeItem("force_exit");
      localStorage.removeItem("force_exit_reason");
      localStorage.removeItem("user_is_logout");
      localStorage.removeItem("user_is_active");
      dispatch(
        updateAuthState({
          is_active: true,
          is_logout: false,
        }),
      );
      dispatch(clearForceExit());
    }
  };

  const handleContinue = () => {
    if (effectiveCanAccessExam) {
      router.push("/exam");
    }
  };

  return (
    <ProtectedRoute requireExamAccess={false}>
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

      {!isLoading && !error && userData?.success && userData.student && (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex flex-col items-center justify-center p-4">
          {/* Status Badge */}

          {/* Lock Warning if needed */}
          {!effectiveCanAccessExam && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "var(--color-background-danger)",
                border: "0.5px solid var(--color-border-danger)",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 12,
                width: "100%",
                maxWidth: 640,
              }}
            >
              <Lock className="h-[18px] w-[18px] text-red-700 flex-shrink-0" />
              <div style={{ flex: 1 }}>
                <p className="font-semibold text-red-700">Akun terkunci</p>
                <p className="text-sm text-red-700/80">
                  Terdeteksi indikasi kecurangan. Hubungi pengawas untuk
                  membuka kunci.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isRefetching}
                className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
              >
                {isRefetching ? "Memeriksa..." : "Periksa Status"}
              </button>
            </div>
          )}

          <StudentInfoCard
            student={userData.student}
            formatDate={formatDate}
            formatGender={formatGender}
          />

          <DashboardActions
            hasExams={!!userData.assigned && userData.assigned.length > 0}
            onContinueToExam={handleContinue}
            canAccess={effectiveCanAccessExam}
          />
        </div>
      )}
    </ProtectedRoute>
  );
};

export default DashboardPage;
