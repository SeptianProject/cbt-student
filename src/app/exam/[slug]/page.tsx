"use client";

import Content from "@/components/exam/ExamContent";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ExamStartConfirmation } from "@/components/exam/ExamStartConfirmation";
import { Button } from "@/components/ui/button";
import { findExamBySlug } from "@/lib/examUtils";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { resetExamState } from "@/store/examSlice";
import React from "react";
import { useCurrentUser } from "@/hooks/useAuthQuery";

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const dispatch = useAppDispatch();
  const [confirmed, setConfirmed] = React.useState(false);

  const { data: userData } = useCurrentUser(true);

  React.useEffect(() => {
    dispatch(resetExamState());

    // Only clear exam_result, keep session_token for potential reuse
    localStorage.removeItem("exam_result");
  }, [dispatch, slug]);

  const currentExam = React.useMemo(() => {
    if (!userData?.assigned || !slug) return null;
    return findExamBySlug(userData.assigned, slug);
  }, [userData?.assigned, slug]);

  const handleConfirm = () => {
    setConfirmed(true);
    router.push(`/exam/${slug}/start`);
  };

  const handleStartExam = () => {
    router.push(`/exam/${slug}/start`);
  };

  if (userData?.assigned && !currentExam && slug) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Ujian Tidak Ditemukan
            </h2>
            <p className="text-gray-600 mb-6">
              Ujian dengan slug &quot;{slug}&quot; tidak ditemukan. Silakan
              kembali ke halaman ujian dan pilih ujian yang tersedia.
            </p>
            <Button onClick={() => router.push("/exam")}>
              Kembali ke Daftar Ujian
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!userData || !currentExam) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data ujian...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="relative flex flex-col justify-between gap-10 p-4 sm:p-8 md:p-10 lg:p-12 min-h-screen bg-white">
        <ExamStartConfirmation
          isVisible={confirmed}
          isPending={false}
          isSuccess={false}
          onConfirm={handleStartExam}
          onCancel={() => setConfirmed(false)}
        />

        <Content userData={userData} />

        <div className="flex justify-center">
          <Button
            className={`px-8 py-3 text-lg ${!currentExam.can_start ? "cursor-not-allowed bg-slate-500" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={handleConfirm}
            disabled={!currentExam.can_start}>
            {currentExam.can_start ? "Mulai Ujian" : "Ujian Belum Tersedia"}
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
