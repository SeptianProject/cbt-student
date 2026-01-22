import React from "react";
import { CheckCircle, Clock, Trophy } from "lucide-react";

interface ExamProgressStatsProps {
  progress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

export const ExamProgressStats: React.FC<ExamProgressStatsProps> = ({
  progress,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle className="w-8 h-8 text-green-600" />
        <div>
          <p className="text-sm text-gray-600">Selesai</p>
          <p className="text-2xl font-bold text-gray-800">
            {progress.completed}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
        <Clock className="w-8 h-8 text-blue-600" />
        <div>
          <p className="text-sm text-gray-600">Dalam Proses</p>
          <p className="text-2xl font-bold text-gray-800">
            {progress.inProgress}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
        <Trophy className="w-8 h-8 text-gray-600" />
        <div>
          <p className="text-sm text-gray-600">Total Ujian</p>
          <p className="text-2xl font-bold text-gray-800">{progress.total}</p>
        </div>
      </div>
    </div>
  );
};
