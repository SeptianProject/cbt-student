import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from "lucide-react";
import type { AssignedExam } from "@/types";

interface ExamCompletionActionsProps {
  countdown: number;
  nextExam: AssignedExam | null;
  allCompleted: boolean;
  onManualNavigation: () => void;
  onBackToDashboard: () => void;
}

export const ExamCompletionActions: React.FC<ExamCompletionActionsProps> = ({
  countdown,
  nextExam,
  allCompleted,
  onManualNavigation,
  onBackToDashboard,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {nextExam && !allCompleted ? (
        <>
          <Button
            onClick={onManualNavigation}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <ArrowRight className="w-5 h-5 mr-2" />
            Lanjut ke Ujian Berikutnya ({countdown}s)
          </Button>
          <Button
            onClick={onBackToDashboard}
            variant="outline"
            size="lg"
            className="font-semibold">
            <Home className="w-5 h-5 mr-2" />
            Kembali ke Dashboard
          </Button>
        </>
      ) : (
        <Button
          onClick={onManualNavigation}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold">
          <Home className="w-5 h-5 mr-2" />
          Kembali ke Dashboard ({countdown}s)
        </Button>
      )}
    </div>
  );
};
