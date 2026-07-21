"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "../lib/cn";
import { Popover, PopoverTrigger, PopoverContent } from "../primitives/popover";
import { IconButton } from "../primitives/icon-button";
import { EmptyState } from "../primitives/empty-state";

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  read: boolean;
  createdAt: Date;
  href?: string;
}

export interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAllRead?: () => void;
  onSelect?: (id: string) => void;
}

export function NotificationCenter({ notifications, onMarkAllRead, onSelect }: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative">
          <IconButton aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`} variant="default" size="sm">
            <Bell />
          </IconButton>
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--danger)]"
              aria-hidden
            />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <p className="text-sm font-medium text-[var(--text-primary)]">Notificações</p>
          {unreadCount > 0 && onMarkAllRead && (
            <button onClick={onMarkAllRead} className="text-xs text-[var(--brand)] hover:underline">
              Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState size="compact" icon={<Bell />} title="Nenhuma notificação" />
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => onSelect?.(n.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-[var(--border)] last:border-0",
                  "hover:bg-[var(--surface-sunken)] transition-colors duration-[var(--dur-fast)]",
                  !n.read && "bg-[var(--brand-subtle)]"
                )}
              >
                <p className="text-sm text-[var(--text-primary)]">{n.title}</p>
                {n.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.description}</p>}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
