import React from "react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/LogoutButton";
import { ArrowRight } from "lucide-react";

interface DashboardActionsProps {
  hasExams: boolean;
  onContinueToExam: () => void;
}

export const DashboardActions: React.FC<DashboardActionsProps> = ({
  hasExams,
  onContinueToExam,
}) => {
  return (
    <div className="mt-6 max-w-md w-full space-y-3">
      {hasExams && (
        <Button
          variant="default"
          onClick={onContinueToExam}
          className="w-full text-base font-semibold">
          <ArrowRight className="w-5 h-5 mr-2" />
          Lanjutkan ke Ujian
        </Button>
      )}

      <LogoutButton
        variant="outline"
        className="w-full text-base font-semibold border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
      />
    </div>
  );
};
