"use client";

import * as React from "react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, DropdownLabel } from "../primitives/dropdown";
import { Avatar } from "../primitives/avatar";

export interface UserMenuProps {
  name: string;
  email: string;
  avatarUrl?: string;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout: () => void;
}

export function UserMenu({ name, email, avatarUrl, onProfile, onSettings, onLogout }: UserMenuProps) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          aria-label={`Menu de ${name}`}
          className="rounded-full focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
        >
          <Avatar name={name} src={avatarUrl} size="sm" />
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-56">
        <DropdownLabel>
          <p className="text-[var(--text-primary)] font-medium">{name}</p>
          <p className="text-[var(--text-muted)] font-normal truncate">{email}</p>
        </DropdownLabel>
        <DropdownSeparator />
        {onProfile && (
          <DropdownItem onSelect={onProfile} className="gap-2.5">
            <UserIcon className="h-4 w-4" /> Meu perfil
          </DropdownItem>
        )}
        {onSettings && (
          <DropdownItem onSelect={onSettings} className="gap-2.5">
            <Settings className="h-4 w-4" /> Configurações
          </DropdownItem>
        )}
        <DropdownSeparator />
        <DropdownItem onSelect={onLogout} destructive className="gap-2.5">
          <LogOut className="h-4 w-4" /> Sair
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
