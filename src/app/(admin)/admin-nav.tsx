"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, MessageCircleQuestion, Users, UserCog, Sparkles, Calendar, Wallet } from "lucide-react";
import { SidebarNav, type SidebarNavSection } from "@/design-system/workspace/sidebar-nav";

/**
 * Único arquivo do painel que sabe que "Consultas" existe como módulo — SidebarNav
 * em si (na plataforma) é genérica. Isso é exatamente a fronteira que a decisão
 * "nenhum módulo controla Sidebar/Topbar" pede: o módulo não controla nada, só
 * aparece como um item nesta lista, montada uma vez no layout.
 */
export function AdminNav() {
  const pathname = usePathname();

  const sections: SidebarNavSection[] = [
    {
      items: [
        { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard />, href: "/", active: pathname === "/" },
      ],
    },
    {
      label: "Operação",
      items: [
        {
          id: "agenda",
          label: "Agenda",
          icon: <Calendar />,
          href: "/agenda",
          active: pathname.startsWith("/agenda"),
        },
        {
          id: "consultas",
          label: "Consultas",
          icon: <MessageCircleQuestion />,
          href: "/consultas",
          active: pathname.startsWith("/consultas"),
        },
        {
          id: "clientes",
          label: "Clientes",
          icon: <Users />,
          href: "/clientes",
          active: pathname.startsWith("/clientes"),
        },
        {
          id: "profissionais",
          label: "Profissionais",
          icon: <UserCog />,
          href: "/profissionais",
          active: pathname.startsWith("/profissionais"),
        },
        {
          id: "servicos",
          label: "Serviços",
          icon: <Sparkles />,
          href: "/servicos",
          active: pathname.startsWith("/servicos"),
        },
        {
          id: "financeiro",
          label: "Financeiro",
          icon: <Wallet />,
          href: "/financeiro",
          active: pathname.startsWith("/financeiro"),
        },
      ],
    },
  ];

  return <SidebarNav sections={sections} linkComponent={Link} />;
}
