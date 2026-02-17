"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { Button, Input } from "@/components/ui";

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

type LoginForm = z.infer<typeof loginSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const GOOGLE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthStore((s) => s.token);
  const redirect = searchParams.get("redirect") || "/dashboard";
  const error = searchParams.get("error");

  const loginMutation = useLogin(redirect);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (token) {
      router.push("/dashboard");
    }
  }, [token, router]);

  useEffect(() => {
    if (error === "oauth_denied") toast.error("Авторизация отклонена");
    else if (error === "no_email")
      toast.error("Не удалось получить email из Google-аккаунта");
    else if (error === "oauth_failed")
      toast.error("Ошибка авторизации через Google");
  }, [error]);

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text mb-2">
          Вход
        </h1>
        <p className="text-text-muted">Войдите в свой аккаунт</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Пароль"
          type="password"
          placeholder="Минимум 8 символов"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loginMutation.isPending}
        >
          Войти
        </Button>
      </form>

      {GOOGLE_AUTH_ENABLED && (
        <>
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-separator" />
            <span className="px-3 text-sm text-text-muted">или</span>
            <div className="flex-1 border-t border-separator" />
          </div>
          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={() => {
              window.location.href = `${API_URL}/api/auth/google`;
            }}
          >
            Войти через Google
          </Button>
        </>
      )}

      <p className="text-center text-sm text-text-muted mt-6">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense>
        <LoginContent />
      </Suspense>
    </main>
  );
}
