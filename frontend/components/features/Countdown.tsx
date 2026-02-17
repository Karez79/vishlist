"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";

interface CountdownProps {
  eventDate: string;
}

export default function Countdown({ eventDate }: CountdownProps) {
  const calcDays = useCallback(() => {
    const event = new Date(eventDate + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = event.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [eventDate]);

  const [daysLeft, setDaysLeft] = useState(calcDays);

  useEffect(() => {
    const id = setInterval(() => setDaysLeft(calcDays()), 60_000);
    return () => clearInterval(id);
  }, [calcDays]);

  // Don't show countdown for past dates
  if (daysLeft < 0) return null;

  const pluralize = (n: number) => {
    const abs = Math.abs(n) % 100;
    const lastDigit = abs % 10;
    if (abs > 10 && abs < 20) return "дней";
    if (lastDigit > 1 && lastDigit < 5) return "дня";
    if (lastDigit === 1) return "день";
    return "дней";
  };

  const isToday = daysLeft === 0;
  const isUrgent = daysLeft <= 3 && daysLeft > 0;

  return (
    <div
      className={`inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-2xl text-sm font-medium ${
        isToday
          ? "bg-gold/10 text-gold"
          : isUrgent
          ? "bg-error/8 text-error"
          : "bg-fill text-text-muted"
      }`}
    >
      <Calendar size={15} />
      {isToday ? (
        <span>Событие сегодня!</span>
      ) : (
        <span>
          {isUrgent ? "Скоро! " : ""}Осталось {daysLeft} {pluralize(daysLeft)}
        </span>
      )}
    </div>
  );
}
