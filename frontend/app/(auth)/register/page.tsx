"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Gift } from "lucide-react";
import { useRegister } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { Button, Input } from "@/components/ui";

const registerSchema = z.object({
  name: z.string().min(1, "Введите имя").max(100),
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов").max(128),
});

type RegisterForm = z.infer<typeof registerSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const GOOGLE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export default function RegisterPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (token) {
      router.push("/dashboard");
    }
  }, [token, router]);

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-text font-bold tracking-tight text-xl mb-6">
            <Gift size={24} className="text-primary" />
            Vishlist
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-text mb-2">
            Регистрация
          </h1>
          <p className="text-text-muted">Создайте аккаунт для управления вишлистами</p>
        </div>

        <div className="bg-surface rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.1)] p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Имя"
              placeholder="Как вас зовут?"
              error={errors.name?.message}
              {...register("name")}
            />
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
              loading={registerMutation.isPending}
            >
              Создать аккаунт
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
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
