"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Input, Modal } from "@/components/ui";
import { useGuestToken } from "@/hooks/useGuestToken";
import apiClient from "@/lib/api-client";

interface GuestRecoveryProps {
  slug: string;
}

export default function GuestRecovery({ slug }: GuestRecoveryProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "token">("email");
  const [email, setEmail] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken } = useGuestToken(slug);

  const handleRecover = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/guest/recover", {
        email: email.trim(),
        wishlist_slug: slug,
      });
      if (data.recovery_token) {
        // Dev mode: token returned directly
        setRecoveryToken(data.recovery_token);
        setStep("token");
      } else {
        toast.success("Проверьте почту — мы отправили ссылку");
        setOpen(false);
      }
    } catch {
      toast.error("Не удалось найти резервацию");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/guest/verify", {
        token: recoveryToken,
      });
      setToken(data.guest_token);
      toast.success("Доступ восстановлен!");
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error("Ссылка недействительна или истекла");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep("email");
      setEmail("");
      setRecoveryToken("");
    }, 200);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-text-muted hover:text-text transition-colors underline underline-offset-2"
      >
        Я уже резервировал(а) тут
      </button>

      <Modal open={open} onOpenChange={handleClose} title="Восстановить доступ">
        {step === "email" ? (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Введите email, который вы указали при резервации.
              Мы найдём вашу резервацию и восстановим доступ.
            </p>
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleRecover}
              loading={loading}
              disabled={!email.trim()}
            >
              Восстановить
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Токен восстановления найден. Нажмите чтобы восстановить доступ.
            </p>
            <Button
              className="w-full"
              onClick={handleVerify}
              loading={loading}
            >
              Подтвердить
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
