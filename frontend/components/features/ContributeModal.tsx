"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Button, Input, Modal } from "@/components/ui";
import { CONFETTI_COLORS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

interface ContributeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle: string;
  price: number;
  totalContributed: number;
  onContribute: (guestName: string, amount: number) => Promise<{ id: string; guest_token: string | null }>;
  onSaveEmail?: (contributionId: string, email: string) => Promise<void>;
  loading?: boolean;
  userName?: string;
}

const PRESETS = [500, 1000, 2000];

export default function ContributeModal({
  open,
  onOpenChange,
  itemTitle,
  price,
  totalContributed,
  onContribute,
  onSaveEmail,
  loading,
  userName,
}: ContributeModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState(userName || "");
  const [amount, setAmount] = useState<string>("");
  const [email, setEmail] = useState("");
  const [contributionId, setContributionId] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const remaining = price - totalContributed;
  const pct = Math.min(Math.round((totalContributed / price) * 100), 100);

  const handleContribute = async () => {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) return;

    try {
      const result = await onContribute(name.trim(), numAmount);
      setContributionId(result.id);
      setStep("success");

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: CONFETTI_COLORS,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleSaveEmail = async () => {
    if (!contributionId || !onSaveEmail || !email.trim()) return;
    setEmailSaving(true);
    try {
      await onSaveEmail(contributionId, email.trim());
      handleClose();
    } catch {
      // Error handled by mutation
    } finally {
      setEmailSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("form");
      setName(userName || "");
      setAmount("");
      setEmail("");
      setContributionId(null);
    }, 200);
  };

  const numAmount = parseInt(amount, 10) || 0;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={step === "form" ? "Скинуться" : ""}
    >
      {step === "form" ? (
        <div className="space-y-4">
          <div className="bg-fill rounded-2xl p-3 text-sm">
            <p className="text-text-muted">
              Собрано {formatPrice(totalContributed)} из{" "}
              {formatPrice(price)} ({pct}%)
            </p>
            <p className="font-medium text-text mt-1">
              Осталось собрать: {formatPrice(remaining)}
            </p>
          </div>

          {!userName && (
            <Input
              label="Ваше имя"
              placeholder="Как вас зовут?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Сумма (₽)
            </label>
            <Input
              type="number"
              min={1}
              max={remaining}
              placeholder={`до ${remaining}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {numAmount > remaining && (
              <p className="text-xs text-error mt-1">
                Максимум: {formatPrice(remaining)}
              </p>
            )}
          </div>

          {/* Preset buttons */}
          <div className="flex gap-2 flex-wrap">
            {PRESETS.filter((p) => p <= remaining).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className={`px-3.5 py-1.5 text-sm rounded-xl border transition-all duration-200 active:scale-95 ${
                  amount === String(preset)
                    ? "border-primary bg-primary text-white"
                    : "border-separator bg-surface text-text-muted hover:bg-fill"
                }`}
              >
                {formatPrice(preset)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(String(remaining))}
              className={`px-3.5 py-1.5 text-sm rounded-xl border transition-all duration-200 active:scale-95 ${
                amount === String(remaining)
                  ? "border-primary bg-primary text-white"
                  : "border-separator bg-surface text-text-muted hover:bg-fill"
              }`}
            >
              Вся сумма
            </button>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleContribute}
            loading={loading}
            disabled={
              !name.trim() || numAmount <= 0 || numAmount > remaining
            }
          >
            Скинуться {numAmount > 0 ? formatPrice(numAmount) : ""}
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="text-4xl mb-2">💝</div>
          <h3 className="text-lg font-bold tracking-tight">Спасибо!</h3>
          <p className="text-text-muted text-sm">
            Вы внесли {formatPrice(numAmount)} на «{itemTitle}»
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
                Без регистрации — только чтобы вы могли отменить вклад
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
