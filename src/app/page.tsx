"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginSchema, LoginFormData } from "@/lib/validations/auth";
import { useLoginMutation } from "@/hooks/useAuthQuery";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Redux state untuk check auth
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  // React Query mutation untuk login
  const loginMutation = useLoginMutation()

  useEffect(() => {
    setMounted(true)

    // Redirect jika sudah authenticated
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [router, isAuthenticated])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data)
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#404040]">Login CBT System</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <Input
                {...register("email")}
                placeholder="Email"
                type="email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Input
                {...register("password")}
                placeholder="Password"
                type="password"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {loginMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {loginMutation.error?.message || 'Login gagal. Silakan coba lagi.'}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || loginMutation.isPending}
              className="w-full font-heading text-white bg-primary/80 hover:bg-primary px-8 text-base  font-medium rounded-md"
            >
              {isSubmitting || loginMutation.isPending ? 'Loading...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}