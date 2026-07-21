import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/db/client";

/**
 * ADL-108 (sessão de banco) + ADL-109 (sem senha): `strategy: "database"`, um
 * único provider de e-mail (magic-link via Resend, já decidido como stack de
 * e-mail desde a arquitetura original). WhatsApp/OTP para o realm Portal fica
 * reservado para quando o Portal do Cliente for implementado — hoje só o realm
 * staff está coberto, que é o que a Fase 3 exigia.
 *
 * Pendência externa real (não implementável sem credencial): `RESEND_API_KEY`
 * e `EMAIL_FROM` precisam existir no ambiente para o provider funcionar de
 * verdade. Sem eles, o app builda e roda, mas login por e-mail falha ao enviar.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? "login@studioos.app",
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verifique-seu-email",
  },
  callbacks: {
    async session({ session, user }) {
      // Session.activeOrganizationId já é resolvido/gravado por
      // requireAuth()/ação de troca de organização (WorkspaceSwitcher) — aqui só
      // garante que session.user.id existe, contrato mínimo que require-auth.ts espera.
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
