# Infrastructure Migration Plan
Studio OS · de mock a real, sem alterar a API pública

---

## Fase 3.1 — Prisma real

`DbClient` + `TenantDb` (extensão) implementados. `prisma migrate dev --name init`
gera a baseline. Health check (`/api/health`) confirma conectividade.
**Ainda não conectado a nenhuma Server Action** — só a infraestrutura de acesso
existe.

## Fase 3.2 — Auth.js + RBAC

Auth.js v5 configurado, modelos `Account`/`Session`/`VerificationToken` migrados.
`requireAuth()`/`requireRole()` implementados. **Ainda sem retrofit nas Server
Actions existentes** — a infraestrutura de autenticação existe isolada.

## Fase 3.3 — AuditLog

Modelo `AuditLog` migrado. `emitirEvento()` trocado por escrita real, em um lugar
só — toda a instrumentação de evento já plantada em cada domínio (Cliente,
Profissional, Serviço, Quote, Appointment, Financeiro) passa a persistir sem
tocar em nenhum desses arquivos de domínio individualmente.

## Fase 3.4 — Observabilidade

Structured logging real, error tracking, `requestId`/`traceId` (nome escolhido
para não colidir com `correlationId` de domínio, seção 5 do Blueprint), métricas
básicas.

## Fase 3.5 — Remover mocks

**A única fase que toca os Application Services diretamente**, domínio por
domínio, nesta ordem (dependência primeiro):

```
1. Organization/User/Membership (pré-requisito de auth, já resolvido na 3.2)
2. Cliente        — + correção do filtro clienteVisivel (achado da auditoria)
3. Profissional
4. Serviço
5. Consulta
6. Quote/Orçamento
7. Appointment     — + $transaction em remarcarAppointment
8. Financeiro      — + correção dos 3 bugs do ADL-103, na mesma passada
```

Cada item: trocar o `TODO: tenantDb(...)` pela chamada real, adicionar
`requireAuth()`/`requireRole()` no topo da Server Action, rodar os testes de
integração da seção correspondente do Risk Matrix. **A assinatura de nenhum
Application Service muda** — só o que preenche `organizationId` (antes: mock
fixo; depois: sessão real) e o que existe atrás do `TODO`.

## Fase 4 em diante (fora deste Blueprint, só para contexto de sequência)

Financeiro Sprint 3 (Pix/Gateway/NF-e) → Estoque → Portal do Cliente → IA —
retomam exatamente de onde a Operational Hardening Audit os pausou, agora sobre
infraestrutura real em vez de mock.
