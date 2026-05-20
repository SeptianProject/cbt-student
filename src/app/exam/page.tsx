"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { createExamSlug } from "@/lib/examUtils";
import { useCurrentUser } from "@/hooks/useAuthQuery";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateAuthState } from "@/store/authSlice";
import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { AssignedExam } from "@/types";

const ExamPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { data: userData, isError, isLoading } = useCurrentUser(true);
  const [authSynced, setAuthSynced] = React.useState(false);

  // Get current auth state from Redux
  const { force_exit } = useAppSelector((state) => state.auth);

  // Determine effective canAccessExam based on latest API data
  const determineCanAccess = React.useCallback(() => {
    if (!userData?.student?.user) {
      return false;
    }

    const user = userData.student.user;
    const is_active = user.is_active;
    const is_logout = user.is_logout || false;

    // If force_exit flag is set, cannot access
    if (force_exit) {
      return false;
    }

    // Can access only if active AND not logged out
    return is_active && !is_logout;
  }, [userData, force_exit]);

  // Sync auth state from API when data loaded
  useEffect(() => {
    if (!isLoading && userData?.student?.user) {
      const user = userData.student.user;
      dispatch(
        updateAuthState({
          is_active: user.is_active,
          is_logout: user.is_logout || false,
        }),
      );
      setAuthSynced(true);
    }
  }, [userData, isLoading, dispatch]);

  // Main routing logic
  useEffect(() => {
    // Wait for API data to load and auth state to sync
    if (isLoading || !authSynced) {
      return;
    }

    const effectiveCanAccess = determineCanAccess();

    // If user cannot access exam, redirect to dashboard
    if (!effectiveCanAccess) {
      router.push("/dashboard");
      return;
    }

    // Check if user has exams
    if (!userData?.assigned || userData.assigned.length === 0) {
      router.push("/dashboard");
      return;
    }

    // Filter out expired exams first
    const validExams = userData.assigned.filter(
      (exam: AssignedExam) => exam.status !== "expired",
    );

    if (validExams.length === 0) {
      // All exams are expired, redirect to dashboard
      router.push("/dashboard");
      return;
    }

    // Sort valid exams by start_date ascending
    const sortedExams = [...validExams].sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateA - dateB;
    });

    // Prioritize available exam that can be started
    let selectedExam = sortedExams.find(
      (exam) => exam.status === "available" && exam.can_start,
    );

    // Fallback to first upcoming exam if no available exam
    if (!selectedExam) {
      selectedExam = sortedExams.find((exam) => exam.status === "upcoming");
    }

    // Final fallback to first valid exam
    if (!selectedExam) {
      selectedExam = sortedExams[0];
    }

    const examSlug = createExamSlug(selectedExam.title);

    localStorage.setItem("exam_id", selectedExam.exam_id.toString());
    localStorage.setItem("exam_duration", selectedExam.duration.toString());
    localStorage.setItem("current_exam_slug", examSlug);

    router.push(`/exam/${examSlug}`);
  }, [userData, isLoading, authSynced, determineCanAccess, router]);

  if (isLoading || !authSynced) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Memuat Data Ujian
            </h2>
            <p className="text-gray-600">
              Sedang mengambil informasi ujian yang tersedia...
            </p>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  // Check again after sync is complete
  const effectiveCanAccess = determineCanAccess();

  if (!effectiveCanAccess) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="p-8 text-center max-w-md">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Akses Diblokir
            </h2>
            <p className="text-gray-600 mb-4">
              Akun Anda sedang dalam status terkunci. Hubungi proktor untuk
              membuka kunci akun.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 w-full">
              Kembali ke Dashboard
            </button>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (isError) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">
              Gagal memuat data ujian. Silakan refresh halaman.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
              Refresh Halaman
            </button>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Menyiapkan Ujian
          </h2>
          <p className="text-gray-600">
            Sedang mengarahkan ke ujian yang tersedia...
          </p>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ExamPage;
