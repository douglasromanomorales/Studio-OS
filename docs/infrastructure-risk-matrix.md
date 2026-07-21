# Infrastructure Risk Matrix
Studio OS · o que muda, o que não muda, o que precisa de teste novo

---

## Módulos afetados (toda Application Service com `TODO: tenantDb`)

| Módulo | Arquivos afetados | Natureza da mudança |
|---|---|---|
| Clientes | `clientes/actions.ts` | Trocar mock por `tenantDb`; aplicar `clienteVisivel` no filtro (achado da auditoria, corrigido nesta fase) |
| Profissionais | `profissionais/actions.ts` | Trocar mock por `tenantDb` |
| Serviços | `servicos/actions.ts` | Trocar mock por `tenantDb` |
| Consultas | `consultas/*/actions.ts` | Trocar mock por `tenantDb` |
| Quote/Orçamentos | `orcamentos/actions.ts` (via Consultas) | Trocar mock por `tenantDb` |
| Appointment/Agenda | `agenda/actions.ts` | Trocar mock por `tenantDb` + `$transaction` em `remarcarAppointment` |
| Financeiro | `financeiro/actions.ts`, `actions-sprint2.ts` | Trocar mock por `tenantDb` **e** corrigir os 3 bugs da auditoria (ADL-103) na mesma passada — tocar o arquivo uma vez só |
| Todas as Server Actions | Todo arquivo `actions.ts` do painel | Adicionar `requireAuth()`/`requireRole()` no topo |

## Módulos NÃO afetados

- **`@codechain/ui` inteiro** — zero acoplamento a persistência, confirmado
  arquiteturalmente desde a primeira decisão de Headless First. Nenhum primitivo,
  composite ou pattern muda.
- **Todo `domain/specifications.ts` e `domain/value-objects.ts`** dos 6 domínios —
  funções puras, já testadas, DB-agnósticas por design. A prova prática de que
  "lógica de domínio nunca importa Prisma diretamente" (disciplina seguida desde
  o domínio Cliente) foi a decisão certa: conectar o banco toca só a camada de
  Application Service, nunca a de domínio.
- **Workspace, Operating Center (estrutura visual)** — só as chamadas de dado que
  alimentam `DecisionCard`s mudam de mock para real; os componentes em si, não.

## Testes que precisarão existir (novos, não existiam até aqui)

1. **Testes de integração por Application Service** contra banco de teste real
   (Postgres efêmero, seed + teardown por teste) — hoje só existem testes
   unitários de função pura de domínio.
2. **Testes de autorização** — confirmar que uma sessão da Organização A nunca
   consegue ler/escrever dado da Organização B, mesmo manipulando o payload da
   requisição (o stress test de multi-tenancy que a Auditoria Operacional já
   citava como pendente).
3. **Testes de transação** — confirmar que `remarcarAppointment`/`pagarComissao`
   não deixam estado parcial se a segunda escrita falhar.
4. **Testes de regressão dos 3 bugs financeiros** — cada um dos achados do
   ADL-103 precisa de um teste que primeiro **falha** reproduzindo o bug, depois
   passa com a correção — evita reintrodução silenciosa.
5. **Teste de impersonation** — confirmar que toda ação durante impersonation
   grava os dois IDs corretos no `AuditLog`.
