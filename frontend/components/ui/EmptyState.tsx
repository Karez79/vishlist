import { cn } from "@/lib/utils";
import Button from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-5 w-16 h-16 rounded-2xl bg-fill flex items-center justify-center text-text-muted/40">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold tracking-tight text-text mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-text-muted text-sm max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
