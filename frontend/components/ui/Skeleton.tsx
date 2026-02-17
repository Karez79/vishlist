import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-orange-50 via-rose-50 to-orange-50 bg-[length:200%_100%]",
        className
      )}
    />
  );
}
