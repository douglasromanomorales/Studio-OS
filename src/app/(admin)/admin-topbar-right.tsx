"use client";

import { NotificationCenter } from "@/design-system/workspace/notification-center";
import { UserMenu } from "@/design-system/workspace/user-menu";

// TODO: substituir por dado real (Notification model + sessão do usuário) quando a
// camada de auth/notificações entrar no roadmap.
const MOCK_NOTIFICATIONS = [
  { id: "1", title: "Nova consulta de Ana Paula Ferreira", read: false, createdAt: new Date() },
  { id: "2", title: "Bronze Natural — janela de recompra de Bianca", read: true, createdAt: new Date() },
];

export function AdminTopbarRight() {
  return (
    <>
      <NotificationCenter notifications={MOCK_NOTIFICATIONS} onMarkAllRead={() => {}} />
      <UserMenu name="Nataly Rodrigues" email="nataly@casanatalyrodrigues.com.br" onLogout={() => {}} />
    </>
  );
}
