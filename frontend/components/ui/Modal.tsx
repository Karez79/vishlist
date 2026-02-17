"use client";

import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
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
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  "fixed z-50 bg-surface shadow-xl focus:outline-none",
                  // Mobile: bottom sheet
                  "bottom-0 left-0 right-0 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto",
                  // Desktop: centered dialog
                  "sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:right-auto",
                  "sm:-translate-x-1/2 sm:-translate-y-1/2",
                  "sm:rounded-2xl sm:w-full sm:max-w-md sm:max-h-[85vh]",
                  className
                )}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                {/* Drag indicator for mobile */}
                <div className="flex justify-center mb-3 sm:hidden">
                  <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div>
                    {title && (
                      <Dialog.Title className="text-lg font-heading font-semibold text-text">
                        {title}
                      </Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="text-sm text-text-muted mt-1">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-text-muted hover:text-text">
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
