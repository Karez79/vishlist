"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Button, Input, Modal } from "@/components/ui";

interface ReserveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle: string;
  onReserve: (guestName: string) => Promise<{ id: string; guest_token: string | null }>;
  onSaveEmail?: (reservationId: string, email: string) => Promise<void>;
  loading?: boolean;
  userName?: string; // For authenticated users
}

export default function ReserveModal({
  open,
  onOpenChange,
  itemTitle,
  onReserve,
  onSaveEmail,
  loading,
  userName,
}: ReserveModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState(userName || "");
  const [email, setEmail] = useState("");
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const handleReserve = async () => {
    try {
      const result = await onReserve(name.trim());
      setReservationId(result.id);
      setStep("success");

      // Confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#007AFF", "#5856D6", "#34C759", "#FF9F0A"],
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleSaveEmail = async () => {
    if (!reservationId || !onSaveEmail || !email.trim()) return;
    setEmailSaving(true);
    try {
      await onSaveEmail(reservationId, email.trim());
      handleClose();
    } catch {
      // Error handled by mutation
    } finally {
      setEmailSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setStep("form");
      setName(userName || "");
      setEmail("");
      setReservationId(null);
    }, 200);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={step === "form" ? "Зарезервировать" : ""}
    >
      {step === "form" ? (
        <div className="space-y-4">
          {userName ? (
            <p className="text-text-muted">
              Зарезервировать «{itemTitle}» от имени{" "}
              <span className="font-medium text-text">{userName}</span>?
            </p>
          ) : (
            <Input
              label="Ваше имя"
              placeholder="Как вас зовут?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Button
            className="w-full"
            size="lg"
            onClick={handleReserve}
            loading={loading}
            disabled={!name.trim()}
          >
            Зарезервировать
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-bold tracking-tight">
            Готово!
          </h3>
          <p className="text-text-muted text-sm">
            Вы зарезервировали «{itemTitle}»
          </p>

          {!userName && onSaveEmail && (
            <div className="mt-6 pt-4 border-t border-separator">
              <p className="text-sm text-text-muted mb-3">
                Куда отправить подтверждение?
              </p>
              <Input
                placeholder="email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-text-muted mt-1">
                Без регистрации — только чтобы вы могли отменить резервацию
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  onClick={handleSaveEmail}
                  loading={emailSaving}
                  disabled={!email.trim()}
                >
                  Отправить
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Не нужно
                </Button>
              </div>
            </div>
          )}

          {(userName || !onSaveEmail) && (
            <Button
              variant="secondary"
              className="w-full mt-4"
              onClick={handleClose}
            >
              Закрыть
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
