"use client";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearForceExit } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useProctorReactivate } from "@/hooks/useProctorReactivate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, AlertCircle, Clock } from "lucide-react";

export default function ExamLockedPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { force_exit, is_active, is_logout, user } = useAppSelector(
    (state) => state.auth,
  );
  const [mounted, setMounted] = useState(false);
  const [forceExitReason, setForceExitReason] = useState<string | null>(null);
  const {
    isChecking,
    error: reactivateError,
    checkReactivationStatus,
  } = useProctorReactivate();

  useEffect(() => {
    setMounted(true);
    // Get force exit reason from localStorage
    if (typeof window !== "undefined") {
      const reason = localStorage.getItem("force_exit_reason");
      setForceExitReason(reason);
    }
  }, []);

  // Redirect if somehow user is active and not logged out
  useEffect(() => {
    if (mounted && is_active && !is_logout && user) {
      dispatch(clearForceExit());
      router.push("/exam");
    }
  }, [mounted, is_active, is_logout, user, router, dispatch]);

  const handleCheckReactivation = useCallback(async () => {
    const reactivated = await checkReactivationStatus();
    if (reactivated) {
      router.push("/exam");
    }
  }, [checkReactivationStatus, router]);

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("force_exit");
      localStorage.removeItem("force_exit_reason");
      localStorage.removeItem("session_token");
      localStorage.removeItem("session_id");
      localStorage.removeItem("exam_id");
    }
    router.push("/");
  };

  if (!mounted) {
    return null;
  }

  const reasonLabel = forceExitReason ? `(${forceExitReason})` : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl border-red-300 bg-white shadow-2xl">
        <div className="p-8">
          {/* Top Alert Bar */}
          <div className="bg-red-50 border-l-4 border-red-600 rounded-r-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 mb-1">
                  Akun dalam Status Terkunci
                </p>
                <p className="text-sm text-red-600">
                  Akun Anda sedang dalam status terkunci. Hanya proktor yang
                  dapat membuka kunci akun.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center mb-8">
            {/* Large Lock Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-50"></div>
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-red-200">
                  <Lock className="w-12 h-12 text-red-600" />
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="inline-block px-4 py-2 bg-red-100 rounded-full mb-4">
              <p className="text-sm font-semibold text-red-700">
                Status: TERKUNCI
              </p>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl font-bold text-red-700 mb-3">
              Akun Anda Terkunci
            </h1>

            {/* Subheading with Reason */}
            <p className="text-gray-600 text-lg mb-2">
              {force_exit
                ? "Akun Anda telah terkunci karena terdeteksi aktivitas mencurigakan atau perintah dari proktor."
                : "Akun Anda sedang dalam status terkunci dan tidak dapat mengakses ujian."}{" "}
              {reasonLabel && (
                <span className="text-sm text-gray-500">{reasonLabel}</span>
              )}
            </p>
          </div>

          {/* Detailed Information Box */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Penyebab Kemungkinan:
              </h3>
              <ul className="text-sm text-gray-700 space-y-1 ml-7">
                <li>
                  • Terdeteksi perpindahan tab atau jendela saat ujian
                  berlangsung
                </li>
                <li>• Terdeteksi upaya meninggalkan aplikasi ujian</li>
                <li>
                  • Terdeteksi penggunaan aplikasi eksternal (copy-paste,
                  screenshot)
                </li>
              </ul>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Apa yang Harus Dilakukan:
              </h3>
              <ol className="text-sm text-gray-700 space-y-1 ml-7">
                <li>1. Hubungi pengawas ujian</li>
                <li>2. Jelaskan apa yang terjadi dengan detail</li>
                <li>3. Tunggu pengawas untuk membuka kunci akun</li>
              </ol>
            </div>

            {user && (
              <div className="text-xs text-gray-500">
                <p>
                  ID Siswa:{" "}
                  <span className="font-mono font-semibold">{user.id}</span>
                </p>
                <p>
                  Nama: <span className="font-semibold">{user.name}</span>
                </p>
              </div>
            )}
          </div>

          {/* Status Checker */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {isChecking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium text-blue-700">
                      Memeriksa status...
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Klik tombol untuk memeriksa status akun
                    </span>
                  </>
                )}
              </div>
              <Button
                onClick={handleCheckReactivation}
                disabled={isChecking}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium">
                {isChecking ? "Memeriksa..." : "Periksa Status"}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {reactivateError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                Pesan Kesalahan:
              </p>
              <p className="text-sm text-yellow-700">{reactivateError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="w-full sm:w-auto">
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
