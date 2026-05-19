import React from "react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/LogoutButton";
import { useAuthStateProtection } from "@/hooks/useAuthStateProtection";
import { ArrowRight, Lock } from "lucide-react";

interface DashboardActionsProps {
  hasExams: boolean;
  onContinueToExam: () => void;
  canAccess?: boolean;
}

export const DashboardActions: React.FC<DashboardActionsProps> = ({
  hasExams,
  onContinueToExam,
  canAccess,
}) => {
  const { canAccessExam } = useAuthStateProtection();
  const effectiveCan =
    typeof canAccess === "boolean" ? canAccess : canAccessExam;

  return (
    <div className="mt-6 max-w-md w-full space-y-3">
      {hasExams && (
        <Button
          variant="default"
          onClick={onContinueToExam}
          disabled={!effectiveCan}
          className="w-full text-base font-semibold"
          title={
            !effectiveCan ? "Akun Anda sedang terkunci. Hubungi proktor." : ""
          }>
          {effectiveCan ? (
            <>
              <ArrowRight className="w-5 h-5 mr-2" />
              Lanjutkan ke Ujian
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Akun Terkunci
            </>
          )}
        </Button>
      )}

      <LogoutButton
        variant="outline"
        className="w-full text-base font-semibold border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
      />
    </div>
  );
};
