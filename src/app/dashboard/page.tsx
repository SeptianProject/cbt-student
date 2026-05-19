"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuthQuery";
import { useAuthStateProtection } from "@/hooks/useAuthStateProtection";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StudentInfoCard } from "@/components/dashboard/StudentInfoCard";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { AlertCircle } from "lucide-react";

const DashboardPage = () => {
  const router = useRouter();
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

  const { data: userData, isLoading, error } = useCurrentUser(hasToken);
  const { is_active, is_logout, force_exit, canAccessExam } =
    useAuthStateProtection();

  // Prefer latest flags from API (`userData`) when available to avoid
  // transient locked state before Redux is updated.
  const apiUser = userData?.student?.user;
  const effectiveIsActive = apiUser?.is_active ?? is_active;
  const effectiveIsLogout = apiUser?.is_logout ?? is_logout;

  const effectiveCanAccessExam =
    canAccessExam ||
    (force_exit !== true &&
      effectiveIsActive === true &&
      effectiveIsLogout === false);

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
            <div className="mb-6 max-w-md w-full rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 mb-1">
                    Akses Ujian Diblokir
                  </p>
                  <p className="text-sm text-red-600">
                    Akun Anda sedang dalam status terkunci. Hubungi proktor
                    untuk membuka kunci akun Anda agar dapat mengakses ujian.
                  </p>
                </div>
              </div>
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
