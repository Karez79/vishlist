import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export default function Card({
  className,
  hoverable = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] p-6",
        hoverable &&
          "transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
