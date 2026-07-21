# Infrastructure Technical Specification (ITS)
Studio OS · especificação definitiva, nível de produção

---

## 1. Prisma Architecture

**Estrutura do client:** dois clientes distintos, nunca um só.
- `lib/db/client.ts` — `prisma` base, singleton cacheado em `globalThis` (padrão
  Next.js contra exaustão de conexão em hot-reload). Uso restrito: resolução de
  sessão/Membership (que precisa atravessar organizações) e ferramentas internas
  de suporte. **Nunca usado por Application Service de domínio.**
- `lib/db/tenant-client.ts` — `tenantDb(organizationId)`, Client Extension que
  injeta `organizationId` em todo `where` (leitura) e `data` (escrita) dos
  modelos tenant-scoped, e **rejeita** (lança `InfrastructureError`) se o
  chamador tentar escrever um `organizationId` diferente do escopado — defesa
  contra bug de tenant cruzado, não só contra ataque.

**Transações:** `prisma.$transaction(async (tx) => { const scoped = tenantDb(orgId, tx); ... })`
— detalhe técnico que precisa estar explícito: o `tenantDb` precisa aceitar um
cliente/transação já aberta como segundo parâmetro opcional, para que chamadas
aninhadas dentro de uma transação continuem escopadas. Sem isso, é fácil escrever
uma transação que "esquece" o tenant scoping no meio do caminho.

**Connection pooling:** Postgres via Supabase, com PgBouncer em modo transação
para o ambiente serverless (Vercel) — cada invocação de função abriria conexão
nova sem isso. `DATABASE_URL` (pooled, `?pgbouncer=true&connection_limit=1`) para
runtime; `DIRECT_URL` (sem pool) exclusivo para `prisma migrate` — padrão já
documentado pelo próprio Prisma para este tipo de topologia.

**Migrations:** `prisma migrate dev` local; `prisma migrate deploy` em CI antes
do deploy — **nunca** `db push` em produção. Arquivos de migration versionados no
repositório, revisados em PR como qualquer código.

**Seed:** `prisma/seed.ts` (já existe, já popula o catálogo real da Casa Nataly)
vira idempotente (upsert em vez de create) para rodar em dev repetidamente sem
erro. Banco de teste usa um seed mínimo próprio (poucas fixtures, não o catálogo
inteiro) — mais rápido, mais fácil de raciocinar sobre em teste.

**Estratégia de rollback:** Prisma Migrate não gera down-migration automática.
Cada migration nasce pequena e reversível manualmente se necessário — **nunca
editar uma migration já aplicada** (o mesmo espírito do Immutable Financial
Ledger, aplicado agora ao próprio histórico de schema). Rollback de emergência
depende de point-in-time recovery do Postgres gerenciado, não de down-migration
automática — mais seguro para mudanças que já moveram dado real.

## 2. Authentication Flow

**Login** — dois realms, dois mecanismos:
- Staff: e-mail + senha (Credentials provider do Auth.js). OAuth social fica fora
  do V1 (sem evidência de necessidade — Platform Discovery).
- Portal do cliente: telefone + código OTP — **primeiro consumidor real do
  `OtpInput`**, construído há muitas rodadas e nunca usado até agora.

**Logout** — encerra a sessão (JWT: instrui o cliente a descartar; sessão de
banco: apaga o registro).

**Refresh** — **decisão deliberada de usar estratégias diferentes por realm:**
sessão de banco (revogável instantaneamente) para staff — importante para
encerrar impersonation e incidentes de segurança sem esperar expiração; JWT
(stateless) para o portal — volume maior de usuários, ações de menor sensibilidade.

**Session lifecycle:** criada no login, `activeOrganizationId` fixado na primeira
(ou última usada) `Membership`; expira por inatividade (12h staff, 30 dias
portal "lembrar de mim"); destruída por logout ou revogação administrativa.

**Organization switching:** `WorkspaceSwitcher` (construído, nunca conectado)
chama uma Server Action que confirma `Membership` do usuário na organização de
destino, depois atualiza `activeOrganizationId` na sessão — **primeiro
comportamento real que dá função a esse componente.**

**Membership resolution:** resolvida por `(userId, activeOrganizationId)`,
cacheada na sessão para não bater no banco a cada requisição, revalidada
periodicamente (ações sensíveis de role sempre revalidam na hora).

**Impersonation:** fluxo separado, só para suporte interno da CodeChain — sessão
com `impersonatedByUserId`, duração máxima curta (1h), nunca renovável
silenciosamente, banner permanente na UI, toda ação audita os dois IDs.

## 3. Authorization

**RBAC:** os 5 `StaffRole` já existentes mapeiam para conjuntos de capacidade —
tabela de permissão vive como **constante de código**, não entidade de banco
(decisão já registrada: Permission como Entity é generalização sem evidência).

**Policies:** função `can(membership, ação)` por módulo (ex:
`canManageFinance(membership)`), colocada perto dos Application Services do
próprio domínio — nunca um motor de policy genérico centralizado sem 2º caso de
uso real que justifique.

**Middleware:** `middleware.ts` faz o gate grosso (redireciona não-autenticado
tentando `/(admin)/*`) — não decide papel/permissão específica, isso é fino
demais para o middleware saber sem contexto de qual ação está sendo chamada.

**Server Actions:** todas começam com `requireAuth()` + `can()`/`requireRole()`
específico antes de chamar o Application Service — nenhuma mudança na
assinatura dos Application Services já construídos.

**API Routes:** webhooks (WhatsApp hoje, Pix/Gateway na Fase 4) usam verificação
de assinatura, não sessão de usuário — pista de autenticação inteiramente
separada, nunca compartilha código com `requireAuth()`.

## 4. Request Lifecycle

Ver diagrama dedicado (`request-lifecycle-diagram.md`). Resumo: Middleware →
Session → Organization Resolution → Permission Check → Application Service
(inalterado) → Prisma (`tenantDb`) → AuditLog → Structured Log → Response.

## 5. Audit Architecture

**AuditLog** — já especificado no Blueprint (seção 4 daquele documento);
`emitirEvento()` (hoje `console.log`) vira a escrita real, sem tocar em nenhum
domínio.

**CorrelationId** (domínio) vs. **RequestId**/**TraceId** (infraestrutura) —
conceitos formalmente separados (ADL-107), nunca reusam o mesmo campo.

**Payload masking:** lista de negação de campos nunca logados verbatim
(`passwordHash`, tokens, e futuramente número de cartão) — aplicada num único
ponto de escrita de log, nunca espalhada por chamador.

**LGPD:** `AuditLog` contém PII (IP, user agent, payload com dado de cliente) —
precisa entrar no mesmo workflow de `anonimizarCliente` (já modelado no domínio
Cliente, ainda não implementado): anonimizar um cliente também precisa redigir/
mascarar o payload dele em `AuditLog`, não só apagar da tabela `Customer`.

**Retention:** proposta inicial — 5 anos para registros com natureza fiscal/
financeira, 2 anos para operacional geral, depois anonimização ou purge (número
exato pendente de revisão jurídica, mas o mecanismo de expurgo precisa existir
desde o desenho, não ser um adendo posterior).

## 6. Error Handling

| Classe | Nasce em | Semântica HTTP |
|---|---|---|
| `ValidationError` | Application Service (Zod) | 400 |
| `BusinessError` | Application Service (regra de domínio, ex: "orçamento expirado") — **é o canal que o padrão `{ ok: false, error }` já usado em todo domínio construído até aqui formaliza**, não uma mudança de padrão | 422 |
| `AuthorizationError` | Wrapper `requireAuth`/`requireRole`, antes do Application Service | 403 |
| `NotFoundError` | Camada de repositório — id inexistente ou de outro tenant retorna NotFound, nunca "sem permissão" (não revela existência entre tenants) | 404 |
| `ConflictError` | Application Service — unique constraint (ex: telefone duplicado), colisão de horário detectada no servidor | 409 |
| `ConcurrencyError` | Camada de transação — dois usuários editando o mesmo registro ao mesmo tempo | 409 |
| `InfrastructureError` | Prisma/rede/conexão — nunca vaza mensagem crua para o cliente, sempre logado com detalhe completo no servidor | 500 |

## 7. Observability

**Structured Logging:** JSON, um `requestId` presente em toda linha.
**Tracing:** SDK plumbado, sem exportador ativo no V1 — mesma filosofia da
Commission Trigger Policy (reservado, ativação é configuração, não refatoração).
**Metrics:** contadores nativos da plataforma de hospedagem, sem serviço próprio.
**Health** (`/api/health`) — processo está vivo.
**Readiness** (`/api/ready`) — **distinto de health:** confirma conectividade de
banco e config crítica; usado pelo deploy para liberar tráfego só quando pronto.
**Liveness** — mesmo endpoint de health, resposta binária simples.
**Performance Budget** — reconfirma Design Language cap. 17.9 (LCP<2.5s,
INP<200ms, CLS<0.1 Portal; TTI<2s Agenda/Dashboard); operacionalizado como
checagem de CI (build falha se um bundle de rota crescer >15% sem justificativa).

## 8. Deployment

**Dev** — local, banco Supabase de desenvolvimento ou Postgres local.
**Stage** — ambiente espelhando produção, banco isolado, nunca compartilha dado.
**Production** — Vercel + Supabase Postgres (stack já decidida).
**CI/CD** — PR roda testes+typecheck+lint+`prisma migrate diff` (detecta drift
de schema); merge em main roda `migrate deploy` antes do deploy.
**Secrets** — no cofre da plataforma de hospedagem, rotação periódica definida
(mínimo anual ou sob suspeita de vazamento).
**Feature Flags** — `Organization.featureFlags` (Json), já decidido no Blueprint.
**Backup** — snapshot diário automático + point-in-time recovery do provedor
gerenciado. RPO alvo: <24h (ou <5min com PITR ativo). RTO alvo: <1h.
**Restore** — runbook documentado, não automatizado no V1 (acesso restrito,
passos manuais claros).
**Disaster Recovery** — single-region no V1, decisão consciente (perfil de risco
atual não justifica multi-region); Fase 4 (Scale) reavalia.

## 9. Security Review

**OWASP Top 10** — mapeado item a item:
1. Broken Access Control → RBAC + tenant scoping (seção 3), pendente do stress
   test de multi-tenancy já cobrado desde a Operational Hardening Audit.
2. Cryptographic Failures → hash de senha via Auth.js (bcrypt/argon2), TLS
   nativo da hospedagem, segredos fora do código.
3. Injection → Prisma parametriza por padrão; nenhuma SQL crua planejada.
4. Insecure Design → mitigado pela disciplina de domínio de toda esta série
   (invariante em Specification, não só validação de UI).
5. Security Misconfiguration → validação de env no boot, sem credencial padrão.
6. Vulnerable Components → scanning de dependência em CI (a configurar).
7. Auth Failures → depende de configuração correta de cookie (ver abaixo).
8. Integrity Failures → migrations revisadas em PR, sem execução de código não
   confiável.
9. Logging/Monitoring Failures → eventos de segurança (login falho, mudança de
   role, impersonation) precisam de **alerta**, não só log — diferença registrada
   explicitamente, não implícita.
10. SSRF → superfície mínima hoje (nenhum fetch de URL fornecida por usuário);
    reavaliar quando integrações (Fase 4) trouxerem webhooks.

**CSRF** — Server Actions do Next.js já verificam `Origin` nativamente; não
reimplementar.
**XSS** — React escapa por padrão; regra explícita: nunca
`dangerouslySetInnerHTML` com conteúdo fornecido por usuário, em lugar nenhum.
**Rate Limit** — obrigatório em login e OTP (superfície de força bruta real —
código de 6 dígitos é só 1 milhão de combinações).
**Brute Force** — bloqueio após N tentativas de OTP falhas.
**JWT** — curto, assinado com segredo forte, rotacionado.
**Cookies** — `httpOnly`, `secure`, `sameSite=lax` (padrão Auth.js, confirmar
que não é enfraquecido em nenhuma configuração).
**Session Hijacking** — mitigado por cookie seguro + sessão curta + log de
anomalia de IP/UA (não bloqueante, só sinalizado — device-binding completo é
over-engineering para o V1, sem evidência de necessidade).

## 10. Infrastructure Readiness Gate

Ver documento dedicado (`infrastructure-release-gate.md`).
