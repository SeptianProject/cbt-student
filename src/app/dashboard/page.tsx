"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuthQuery";
import { useAuthStateProtection } from "@/hooks/useAuthStateProtection";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StudentInfoCard } from "@/components/dashboard/StudentInfoCard";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { Lock } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { clearAuth, clearForceExit, updateAuthState } from "@/store/authSlice";

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

  const hasAssignedExams =
    Array.isArray(userData?.assigned) && userData.assigned.length > 0;

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

  const handleBackToLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("api_token");
      localStorage.removeItem("user_is_active");
      localStorage.removeItem("user_is_logout");
      localStorage.removeItem("force_exit");
      localStorage.removeItem("force_exit_reason");
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_id");
      localStorage.removeItem("exam_id");
      localStorage.removeItem("current_exam_slug");
    }

    dispatch(clearAuth());
    dispatch(clearForceExit());
    setHasToken(false);
    router.push("/");
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
              <Button
                type="button"
                variant="destructive"
                className="mt-4"
                onClick={handleBackToLogin}>
                Kembali ke Halaman Login
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !error && !userData?.success && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
          <Card className="max-w-md mx-auto w-full border-red-200 shadow-sm">
            <CardContent className="text-center p-6">
              <p className="font-semibold text-red-600">Gagal memuat data</p>
              <p className="text-sm text-gray-500 mt-1">
                Terjadi kesalahan saat mengambil data. Coba refresh halaman.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleBackToLogin}>
                  Kembali ke Halaman Login
                </Button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700">
                  Refresh
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !error && userData?.success && !userData?.student && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-md">
            <p className="font-semibold text-gray-700">
              Data siswa tidak ditemukan
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Hubungi administrator untuk memastikan akun Anda sudah terdaftar
              dengan benar.
            </p>
            <Button
              type="button"
              variant="destructive"
              className="mt-4"
              onClick={handleBackToLogin}>
              Kembali ke Halaman Login
            </Button>
          </div>
        </div>
      )}

      {!isLoading &&
        !error &&
        userData?.success &&
        userData.student &&
        !hasAssignedExams && (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-md">
              <p className="font-semibold text-gray-700">
                Belum ada ujian tersedia
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Belum ada ujian yang diberikan untuk akun Anda saat ini.
              </p>
              <Button
                type="button"
                variant="destructive"
                className="mt-4"
                onClick={handleBackToLogin}>
                Kembali ke Halaman Login
              </Button>
            </div>
          </div>
        )}

      {!isLoading &&
        !error &&
        userData?.success &&
        userData.student &&
        hasAssignedExams && (
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
                }}>
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
                  className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60">
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
              hasExams={hasAssignedExams}
              onContinueToExam={handleContinue}
              canAccess={effectiveCanAccessExam}
            />
          </div>
        )}
    </ProtectedRoute>
  );
};

export default DashboardPage;
