import { cn, formatPrice } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  contributorsCount?: number;
  className?: string;
}

export default function ProgressBar({
  current,
  total,
  contributorsCount,
  className,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const isComplete = percentage >= 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-800 ease-out",
            "bg-gradient-to-r from-gold to-primary",
            isComplete && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-text-muted mt-1.5">
        {isComplete ? (
          <span className="text-success font-medium">Собрано!</span>
        ) : (
          <>
            Собрано {formatPrice(current)} из {formatPrice(total)}
            {contributorsCount !== undefined &&
              contributorsCount > 0 &&
              ` · ${contributorsCount} ${contributorsCount === 1 ? "участник" : contributorsCount < 5 ? "участника" : "участников"}`}
          </>
        )}
      </p>
    </div>
  );
}
