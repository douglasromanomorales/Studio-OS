# Request Lifecycle Diagram
Studio OS

```
┌─────────────────┐
│  HTTP Request     │  ex: POST /agenda (Server Action "criarAppointment")
└────────┬─────────┘
         ▼
┌─────────────────────────────────────────────────────────┐
│ Middleware                                                 │
│  • gera requestId                                           │
│  • gate grosso: rota protegida sem sessão? → redirect login │
└────────┬────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────┐
│ Session                                                     │
│  • Auth.js resolve sessão a partir do cookie                │
│  • sem sessão válida → AuthorizationError (401)              │
└────────┬────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────┐
│ Organization Resolution                                     │
│  • lê activeOrganizationId da sessão                         │
│  • confirma Membership ainda válida (cache + revalidação)    │
│  • Membership revogada → AuthorizationError (403)             │
└────────┬────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────┐
│ Permission Check                                             │
│  • requireRole/can() específico da ação                       │
│  • papel insuficiente → AuthorizationError (403)               │
└────────┬────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────┐
│ Application Service (INALTERADO)                            │
│  • criarAppointment(organizationId, input)                    │
│  • as 9 checagens do Agenda Orchestration Blueprint            │
│  • regra violada → BusinessError (422), nunca chega ao Prisma  │
└────────┬────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────┐
│ Prisma (tenantDb)                                            │
│  • escrita/leitura escopada por organizationId                 │
│  • dentro de $transaction quando multi-step                    │
│  • falha de conexão → InfrastructureError (500, mensagem       │
│    genérica ao cliente, detalhe completo só no log servidor)   │
└────────┬────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────┐
│ Audit Log                                                     │
│  • AuditLog.create() — userId, organizationId, action,         │
│    entityType/Id, payload (mascarado), requestId,               │
│    correlationId (se aplicável)                                 │
└────────┬────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────┐
│ Structured Log                                                │
│  • linha JSON: requestId, latência, outcome, rota               │
└────────┬────────────────────────────────────────────────┘
         ▼
┌─────────────────┐
│  HTTP Response     │  { ok: true, id } — mesmo formato que os
└─────────────────┘  Application Services já retornam hoje
```

## Onde cada classe de erro interrompe o fluxo

```
AuthorizationError  → Session / Organization Resolution / Permission Check
ValidationError      → início do Application Service (Zod)
BusinessError         → dentro do Application Service (regra de domínio)
ConflictError          → Application Service ou escrita Prisma
ConcurrencyError        → transação Prisma
NotFoundError            → camada de repositório (id de outro tenant = 404, nunca 403)
InfrastructureError       → Prisma, nunca vaza detalhe ao cliente
```

Em todos os casos de erro, **Audit Log e Structured Log ainda registram a
tentativa** — uma ação que falhou por regra de negócio ou permissão é, ela
mesma, um fato que vale auditar (ex: "tentativa de agendar sem orçamento
aceito" é dado operacional útil, não só sucesso).
