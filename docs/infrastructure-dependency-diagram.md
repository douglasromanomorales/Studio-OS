# Infrastructure Dependency Diagram
Studio OS

```
                        ┌─────────────────────┐
                        │   Auth.js (Session)  │
                        └──────────┬───────────┘
                                   │ resolve userId
                                   ▼
                        ┌─────────────────────┐
                        │  Membership Resolver │  (prisma base client —
                        │  (activeOrganizationId)  atravessa organizações)
                        └──────────┬───────────┘
                                   │ organizationId confirmado
                                   ▼
                        ┌─────────────────────┐
                        │   requireAuth() /     │
                        │   requireRole()/can() │  ← Authorization (seção 3)
                        └──────────┬───────────┘
                                   │
                                   ▼
      ┌────────────────────────────────────────────────────┐
      │         Server Action (por módulo/domínio)          │
      └───────────────────────┬──────────────────────────────┘
                               │ organizationId (da sessão, nunca do cliente)
                               ▼
      ┌────────────────────────────────────────────────────┐
      │   Application Service (JÁ EXISTE, INALTERADO)        │
      │   Cliente · Profissional · Serviço · Quote ·         │
      │   Appointment · Financeiro                            │
      └───────────────────────┬──────────────────────────────┘
                               │
                               ▼
      ┌────────────────────────────────────────────────────┐
      │        tenantDb(organizationId) — Prisma Extension   │
      └───────────────────────┬──────────────────────────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                             ▼
      ┌───────────────────┐         ┌───────────────────────┐
      │  Postgres (Supabase)│         │  AuditLog.create()     │
      │  via PgBouncer       │         │  (emitirEvento real)   │
      └───────────────────┘         └───────────┬───────────┘
                                                   │
                                                   ▼
                                     ┌───────────────────────┐
                                     │  Structured Log (JSON)  │
                                     │  requestId presente      │
                                     └───────────────────────┘
```

## Dependências entre peças de infraestrutura

| Peça | Depende de | Não depende de |
|---|---|---|
| `tenantDb` | Prisma base client, `organizationId` resolvido | Auth.js diretamente (recebe o id já resolvido) |
| `requireAuth`/`requireRole` | Auth.js Session, Membership Resolver | Prisma diretamente (usa o client base só para resolver Membership) |
| Application Services (domínio) | `tenantDb` (via parâmetro já existente) | Auth.js, Session, Middleware — **zero acoplamento**, confirmado no Risk Matrix |
| AuditLog | `tenantDb`, `requestId`/`correlationId` gerados a montante | Structured Log (gravados em paralelo, não em sequência) |
| Structured Log | `requestId` (gerado no Middleware) | AuditLog (mesma independência) |
| Feature Flags | `Organization` (campo Json) | Nada externo — leitura simples |

**Confirmação central:** nenhuma seta neste diagrama entra em `domain/*.ts` de
nenhum módulo — exatamente o que o Risk Matrix já garantia. A infraestrutura
inteira vive entre a Server Action e o Prisma; a lógica de negócio nunca sabe que
nada disso existe.
