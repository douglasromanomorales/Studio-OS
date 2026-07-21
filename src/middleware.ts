import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de proteção de rotas — deliberadamente SEM importar `@/lib/auth/auth`.
 *
 * Motivo (Edge Runtime, Vercel): o middleware roda em Edge; o NextAuth configurado
 * com PrismaAdapter + `session: "database"` depende do Prisma Client, que não
 * executa em Edge Runtime — importá-lo aqui quebra o build na Vercel.
 *
 * Estratégia (padrão documentado do Auth.js para sessão de banco):
 * - Aqui: checagem OTIMISTA — presença do cookie de sessão. Barata, Edge-safe.
 * - Camada server (`requireAuth()` em lib/auth/require-auth.ts): validação REAL
 *   da sessão contra o banco, membership e capabilities. É ela quem manda.
 *
 * Um cookie forjado passa pelo middleware mas morre no requireAuth — o middleware
 * é UX (redirect cedo), não fronteira de segurança.
 */
const PUBLIC_ROUTES = ["/login", "/api/auth"];

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const hasSessionCookie = SESSION_COOKIES.some((name) => req.cookies.has(name));

  if (!hasSessionCookie && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
