"use client";

import React, { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCode: string;
}

/**
 * Global Error Boundary component untuk menangani errors di level aplikasi
 * Handles:
 * - 401 Unauthorized
 * - 403 Forbidden (force_exit)
 * - Session errors
 * - Network errors
 */
export class GlobalErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCode: "UNKNOWN",
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let errorCode = "UNKNOWN";

    if (error.message.includes("401")) {
      errorCode = "UNAUTHORIZED";
    } else if (error.message.includes("403")) {
      errorCode = "FORBIDDEN";
    } else if (error.message.includes("session")) {
      errorCode = "SESSION_ERROR";
    } else if (error.message.includes("token")) {
      errorCode = "TOKEN_ERROR";
    }

    return {
      hasError: true,
      error,
      errorCode,
    };
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCode: "UNKNOWN",
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          errorCode={this.state.errorCode}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorDisplayProps {
  error: Error | null;
  errorCode: string;
  onReset: () => void;
}

function ErrorDisplay({ error, errorCode, onReset }: ErrorDisplayProps) {
  const router = useRouter();

  const getErrorMessage = (
    code: string,
  ): { title: string; message: string } => {
    switch (code) {
      case "UNAUTHORIZED":
        return {
          title: "Sesi Berakhir",
          message: "Sesi Anda telah berakhir. Silakan login kembali.",
        };
      case "FORBIDDEN":
        return {
          title: "Akun Terkunci",
          message:
            "Akun Anda telah terkunci. Hubungi proktor untuk aktivasi ulang.",
        };
      case "SESSION_ERROR":
        return {
          title: "Error Sesi",
          message: "Terjadi error dengan sesi Anda. Silakan refresh halaman.",
        };
      case "TOKEN_ERROR":
        return {
          title: "Error Token",
          message: "Token autentikasi tidak valid. Silakan login kembali.",
        };
      default:
        return {
          title: "Error Sistem",
          message: "Terjadi error tak terduga. Silakan coba lagi.",
        };
    }
  };

  const { title, message } = getErrorMessage(errorCode);

  const handleRedirect = () => {
    if (errorCode === "UNAUTHORIZED" || errorCode === "TOKEN_ERROR") {
      localStorage.removeItem("api_token");
      router.push("/");
    } else if (errorCode === "FORBIDDEN") {
      router.push("/dashboard");
    } else {
      onReset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md border-red-300 bg-white shadow-lg">
        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
              <svg
                className="w-10 h-10 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-red-600 mb-2">{title}</h1>
          <p className="text-gray-600 mb-6">{message}</p>

          {error && (
            <div className="bg-gray-100 rounded p-3 mb-6 text-xs text-gray-700 text-left max-h-24 overflow-y-auto">
              <p className="font-semibold mb-1">Detail Error:</p>
              <p className="break-words">{error.message}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleRedirect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {errorCode === "UNAUTHORIZED" || errorCode === "TOKEN_ERROR"
                ? "Login Kembali"
                : errorCode === "FORBIDDEN"
                  ? "Ke Halaman Lockout"
                  : "Kembali"}
            </Button>

            {errorCode === "UNKNOWN" && (
              <Button variant="outline" onClick={onReset} className="w-full">
                Coba Lagi
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
