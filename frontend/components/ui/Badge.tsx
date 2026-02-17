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
  available: "bg-white/80 text-success ring-success/20",
  reserved: "bg-white/80 text-reserved ring-reserved/20",
  collecting: "bg-white/80 text-gold ring-gold/20",
  collected: "bg-white/80 text-success ring-success/20",
  archived: "bg-white/80 text-text-muted ring-separator",
};

export default function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        "backdrop-blur-md ring-1 shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
