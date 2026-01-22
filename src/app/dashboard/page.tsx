"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuthQuery";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StudentInfoCard } from "@/components/dashboard/StudentInfoCard";
import { DashboardActions } from "@/components/dashboard/DashboardActions";

const DashboardPage = () => {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);

  // Check if token exists in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("api_token");
      setHasToken(!!token);
    }
  }, []);

  const { data: userData, isLoading, error } = useCurrentUser(hasToken);

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
    router.push("/exam");
  };

  return (
    <ProtectedRoute>
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
          <StudentInfoCard
            student={userData.student}
            formatDate={formatDate}
            formatGender={formatGender}
          />

          <DashboardActions
            hasExams={!!userData.assigned && userData.assigned.length > 0}
            onContinueToExam={handleContinue}
          />
        </div>
      )}
    </ProtectedRoute>
  );
};

export default DashboardPage;
