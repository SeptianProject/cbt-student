"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { CheckCircle, InfoIcon } from "lucide-react";
import { authService } from "@/services/auth";
import { findExamBySlug } from "@/lib/examUtils";
import { useExamCompletion } from "@/hooks/useExamCompletion";
import { ExamCompletionActions } from "@/components/exam/ExamCompletionActions";

export default function ExamCompletePage() {
  const params = useParams();
  const currentSlug = params.slug as string;

  const { data: userData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authService.getCurrentUser,
  });

  const completedExam = React.useMemo(() => {
    if (!userData?.assigned || !currentSlug) return null;
    return findExamBySlug(userData.assigned, currentSlug);
  }, [userData?.assigned, currentSlug]);

  const allExams = React.useMemo(() => {
    return userData?.assigned || [];
  }, [userData?.assigned]);

  const {
    countdown,
    isTransitioning,
    examResult,
    isClient,
    nextExam,
    allCompleted,
    handleManualNavigation,
    handleBackToDashboard,
  } = useExamCompletion({
    completedExam,
    allExams,
  });

  if (isTransitioning) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {nextExam
                ? "Memuat Ujian Berikutnya..."
                : "Kembali ke Dashboard..."}
            </h2>
            <p className="text-gray-600">
              {nextExam
                ? `Menuju ujian: ${nextExam.title}`
                : "Semua ujian telah selesai!"}
            </p>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!isClient) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Memuat...
            </h2>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <Card className="max-w-2xl w-full p-8 text-center shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Ujian Selesai!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Selamat! Anda telah berhasil menyelesaikan ujian. Jawaban Anda telah
            tersimpan dengan aman.
          </p>

          {examResult && (
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-800 mb-4">Hasil Ujian</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {examResult.total_score}
                  </div>
                  <div className="text-sm text-blue-700">Skor</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {examResult.percentage?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Persentase</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {examResult.grade.letter}
                  </div>
                  <div className="text-sm text-purple-700">
                    {examResult.grade.description}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {examResult.answered_questions}/{examResult.total_questions}
                  </div>
                  <div className="text-sm text-orange-700">Terjawab</div>
                </div>
              </div>
            </div>
          )}

          {nextExam && !allCompleted ? (
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-800 mb-3">
                Ujian Berikutnya: {nextExam.title}
              </h3>
              <p className="text-sm text-blue-700">
                {isClient && `Otomatis mengarahkan dalam ${countdown} detik`}
              </p>
            </div>
          ) : (
            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-green-800 mb-3">
                🎉 Semua Ujian Selesai!
              </h3>
              <p className="text-sm text-green-700">
                {isClient &&
                  `Otomatis mengarahkan ke dashboard dalam ${countdown} detik`}
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <InfoIcon className="w-5 h-5" />
              Informasi Penting
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Hasil ujian akan diumumkan sesuai jadwal</li>
              <li>• Anda dapat melihat hasil di dashboard setelah diumumkan</li>
              <li>• Hubungi pengawas jika ada pertanyaan</li>
            </ul>
          </div>

          <ExamCompletionActions
            countdown={countdown}
            nextExam={nextExam}
            allCompleted={allCompleted}
            onManualNavigation={handleManualNavigation}
            onBackToDashboard={handleBackToDashboard}
          />
        </Card>
      </div>
    </ProtectedRoute>
  );
}
