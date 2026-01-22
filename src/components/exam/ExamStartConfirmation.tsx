import React from "react";
import { Button } from "@/components/ui/button";

interface ExamStartConfirmationProps {
  isVisible: boolean;
  isPending: boolean;
  isSuccess: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExamStartConfirmation: React.FC<ExamStartConfirmationProps> = ({
  isVisible,
  isPending,
  isSuccess,
  onConfirm,
  onCancel,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-20">
      <div
        className={`w-96 h-72 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none bg-white rounded-xl shadow-lg flex flex-col items-center justify-between gap-10 z-20 p-5 py-20
                    ${isSuccess ? "scale-0" : "scale-100"} transition-transform duration-300`}>
        <div>
          <p className="text-gray-600 text-center">
            Setelah ujian dimulai, timer akan berjalan otomatis. Pastikan
            koneksi internet Anda stabil. Mulai ujian sekarang?
          </p>
        </div>
        <div className="flex gap-5 items-center justify-center">
          <Button variant="default" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Memulai Ujian..." : "Mulai Ujian"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Kembali
          </Button>
        </div>
      </div>
      <div
        className={`bg-black w-full h-full absolute top-0 left-0 select-none ${isSuccess ? "opacity-0 pointer-events-none" : "opacity-40"}`}></div>
    </div>
  );
};
