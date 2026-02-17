"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";
import type { User } from "@/types";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;

    const token = searchParams.get("token");
    if (!token) {
      router.push("/login?error=oauth_failed");
      return;
    }

    processed.current = true;

    // Remove token from URL for security
    window.history.replaceState({}, "", "/callback");

    // Clear any stale auth before setting new one
    localStorage.removeItem("auth-storage");

    // Fetch user data and store auth
    apiClient
      .get<User>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setAuth(token, res.data);
        router.push("/dashboard");
      })
      .catch(() => {
        router.push("/login?error=oauth_failed");
      });
  }, [searchParams, setAuth, router]);

  return null;
}

export default function CallbackPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-text-muted">Авторизация...</p>
      </div>
      <Suspense>
        <CallbackContent />
      </Suspense>
    </main>
  );
}
