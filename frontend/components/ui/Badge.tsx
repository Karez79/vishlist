import { cn } from "@/lib/utils";

type BadgeVariant =
  | "available"
  | "reserved"
  | "collecting"
  | "collected"
  | "archived";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  available: "bg-success/10 text-success",
  reserved: "bg-reserved/10 text-reserved",
  collecting: "bg-gold/10 text-gold",
  collected: "bg-success/10 text-success",
  archived: "bg-gray-100 text-text-muted",
};

export default function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
