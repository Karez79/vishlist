"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";
import type { User } from "@/types";

interface AuthResponse {
  access_token: string;
  token_type: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

async function fetchMe(token: string): Promise<User> {
  const response = await apiClient.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export function useRegister(redirectTo?: string) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        data
      );
      return response.data;
    },
    onSuccess: async (data) => {
      const user = await fetchMe(data.access_token);
      setAuth(data.access_token, user);
      toast.success(`Добро пожаловать, ${user.name}!`);
      router.push(redirectTo || "/dashboard");
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, "Ошибка регистрации"));
    },
  });
}

export function useLogin(redirectTo?: string) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        data
      );
      return response.data;
    },
    onSuccess: async (data) => {
      const user = await fetchMe(data.access_token);
      setAuth(data.access_token, user);
      router.push(redirectTo || "/dashboard");
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, "Неверный email или пароль"));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return () => {
    logout();
    router.push("/login");
  };
}
