"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Gift } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui";

const emptySubscribe = () => () => {};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (mounted && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, token, router, pathname]);

  if (!mounted || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-separator">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-text font-bold tracking-tight text-xl"
          >
            <Gift size={24} />
            Vishlist
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted hidden sm:inline">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Выйти">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
