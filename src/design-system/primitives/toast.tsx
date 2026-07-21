"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../lib/cn";
import { IconButton } from "./icon-button";

/**
 * Toast — achado tardio: estava na lista de Primitives desde a Onda 1, nunca chegou
 * a ser construído (perdido nas reorganizações de roadmap). A Feedback Layer do
 * Workspace não fecha sem ele, então nasce aqui, não como pedido novo.
 */
export const ToastProvider = ToastPrimitive.Provider;

export function ToastViewport({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[380px]",
        className
      )}
      {...props}
    />
  );
}

const TOAST_ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const TOAST_COLORS = {
  success: "text-[var(--success)]",
  error: "text-[var(--danger)]",
  info: "text-[var(--brand)]",
} as const;

export interface ToastRootProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: keyof typeof TOAST_ICONS;
  title: string;
  description?: string;
}

export function Toast({ className, variant = "info", title, description, ...props }: ToastRootProps) {
  const Icon = TOAST_ICONS[variant];
  return (
    <ToastPrimitive.Root
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-lg)]",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        "data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right",
        className
      )}
      {...props}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", TOAST_COLORS[variant])} aria-hidden />
      <div className="flex-1 min-w-0">
        <ToastPrimitive.Title className="text-sm font-medium text-[var(--text-primary)]">
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="text-sm text-[var(--text-secondary)] mt-0.5">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close asChild>
        <IconButton aria-label="Fechar notificação" variant="default" size="sm">
          <X />
        </IconButton>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

// ---- Fila imperativa (toast.success("...")) por cima do Radix, que é declarativo ----

type QueuedToast = ToastRootProps & { id: string };
type Listener = (toasts: QueuedToast[]) => void;

class ToastQueue {
  private toasts: QueuedToast[] = [];
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l(this.toasts));
  }

  push(toast: Omit<QueuedToast, "id">) {
    const id = Math.random().toString(36).slice(2);
    this.toasts = [...this.toasts, { ...toast, id }];
    this.emit();
    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  }
}

const queue = new ToastQueue();

export const toast = {
  success: (title: string, description?: string) =>
    queue.push({ variant: "success", title, description }),
  error: (title: string, description?: string) =>
    queue.push({ variant: "error", title, description }),
  info: (title: string, description?: string) =>
    queue.push({ variant: "info", title, description }),
};

/** Monta uma única vez na raiz do Workspace — nunca por módulo. */
export function Toaster() {
  const [toasts, setToasts] = React.useState<QueuedToast[]>([]);

  React.useEffect(() => {
    return queue.subscribe(setToasts);
  }, []);

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, ...t }) => (
        <Toast
          key={id}
          {...t}
          onOpenChange={(open) => !open && queue.dismiss(id)}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}