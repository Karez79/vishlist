"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 300], [1, 0.2]);

  // Reset drag position when modal opens
  useEffect(() => {
    if (open) y.set(0);
  }, [open, y]);

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onOpenChange(false);
    } else {
      // Snap back
      y.set(0);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/25 backdrop-blur-md z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ opacity: backdropOpacity }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  "fixed z-50 bg-surface focus:outline-none",
                  // Mobile: bottom sheet
                  "bottom-0 left-0 right-0 rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto",
                  "shadow-[0_-8px_40px_rgba(0,0,0,0.1),0_-2px_12px_rgba(0,0,0,0.06)]",
                  // Desktop: centered dialog
                  "sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:right-auto",
                  "sm:-translate-x-1/2 sm:-translate-y-1/2",
                  "sm:rounded-3xl sm:w-full sm:max-w-md sm:max-h-[85vh]",
                  "sm:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_20px_rgba(0,0,0,0.08)]",
                  className
                )}
                initial={{ opacity: 0, y: 60, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.98 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
              >
                {/* Mobile drag handle — swipe down to dismiss */}
                <motion.div
                  className="flex justify-center pt-1 pb-4 -mt-1 cursor-grab active:cursor-grabbing sm:hidden"
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.6 }}
                  onDragEnd={handleDragEnd}
                  style={{ y }}
                >
                  <div className="w-10 h-1 rounded-full bg-separator" />
                </motion.div>

                <div className="flex items-start justify-between mb-4">
                  <div>
                    {title && (
                      <Dialog.Title className="text-xl font-semibold tracking-tight text-text">
                        {title}
                      </Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="text-sm text-text-muted mt-1">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close className="p-2 -mr-1 rounded-xl hover:bg-fill transition-colors text-text-muted hover:text-text" aria-label="Закрыть">
                    <X size={20} />
                  </Dialog.Close>
                </div>

                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
