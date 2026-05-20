"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AlertTriangle, Lock, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

interface ForcedExitModalProps {
  isOpen: boolean;
  reason?: string;
  onClose?: () => void;
  showCancel?: boolean;
}

export const ForcedExitModal: React.FC<ForcedExitModalProps> = ({
  isOpen,
  reason,
  onClose,
  showCancel = true,
}) => {
  const router = useRouter();

  const getReasonMessage = (): {
    title: string;
    description: string;
    icon: React.ReactNode;
  } => {
    switch (reason) {
      case "tab_switch":
        return {
          title: "Tab Switched Detected",
          description:
            "Perpindahan tab terdeteksi saat ujian berlangsung. Akun Anda telah dikunci untuk keamanan.",
          icon: <ShieldAlert className="h-12 w-12 text-red-500" />,
        };
      case "window_blur":
        return {
          title: "Kehilangan Fokus Aplikasi",
          description:
            "Aplikasi kehilangan fokus saat ujian. Akun Anda telah dikunci untuk keamanan.",
          icon: <ShieldAlert className="h-12 w-12 text-red-500" />,
        };
      case "force_exit":
        return {
          title: "Akun Terkunci - Force Exit",
          description:
            "Akun Anda telah terkunci karena terdeteksi aktivitas tidak sah atau perintah dari proktor.",
          icon: <Lock className="h-12 w-12 text-red-600" />,
        };
      case "is_active_and_is_logout":
        return {
          title: "Akun Terkunci",
          description:
            "Akun Anda sedang dalam status terkunci. Hubungi proktor untuk membuka kunci akun.",
          icon: <Lock className="h-12 w-12 text-red-600" />,
        };
      default:
        return {
          title: "Akun Terkunci",
          description:
            "Akun Anda telah terkunci oleh sistem. Hubungi proktor untuk informasi lebih lanjut.",
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        };
    }
  };

  const { title, description, icon } = getReasonMessage();

  const handleGoToDashboard = () => {
    if (onClose) onClose();
    router.push("/dashboard");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose || (() => {})}>
      <div className="space-y-4 text-center py-2">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            {icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-red-600 mb-2">{title}</h3>

        {/* Description */}
        <p className="text-gray-700 mb-4 text-base">{description}</p>

        {/* Info Box */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-md p-4 my-4 text-left">
          <p className="text-sm font-semibold text-red-700 mb-2">
            Informasi Penting:
          </p>
          <ul className="text-sm text-red-600 space-y-1">
            <li>• Akun Anda telah dikunci untuk keamanan ujian</li>
            <li>• Hubungi proktor untuk membuka kunci</li>
            <li>• Jangan keluar dari aplikasi tanpa izin proktor</li>
            <li>• Ikuti semua instruksi proktor dengan cermat</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4">
          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-red-600 hover:bg-red-700 text-white">
            Mengerti, Ke Halaman Terkunci
          </Button>

          {showCancel && (
            <Button
              variant="outline"
              onClick={onClose || (() => {})}
              className="w-full">
              Tutup
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
