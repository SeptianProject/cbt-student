import React from "react";
import type { ExamSubmitResult } from "@/types";

interface ExamResultCardProps {
  examResult: ExamSubmitResult["data"] | null;
}

export const ExamResultCard: React.FC<ExamResultCardProps> = ({
  examResult,
}) => {
  if (!examResult) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Ringkasan Hasil Ujian
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Total Soal</p>
          <p className="text-2xl font-bold text-gray-800">
            {examResult.total_questions}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Dijawab</p>
          <p className="text-2xl font-bold text-blue-600">
            {examResult.answered_questions}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Tidak Dijawab</p>
          <p className="text-2xl font-bold text-orange-600">
            {examResult.unanswered_questions}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Nilai Total</p>
          <p className="text-2xl font-bold text-purple-600">
            {examResult.total_score}
          </p>
        </div>
      </div>
    </div>
  );
};
