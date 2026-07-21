# Infrastructure Foundation Blueprint
Studio OS · transformar o modelo em aplicação executável, sem alterar nenhuma regra de negócio

> Compatibilidade confirmada logo de saída: **nada neste documento exige mudar a
> assinatura de um único Application Service já construído.** `organizationId`
> como primeiro parâmetro (regra vigente desde o domínio Cliente) já era,
> silenciosamente, a decisão certa para este momento — a autenticação vai
> *preencher* esse parâmetro a partir da sessão, nunca vai exigir reescrevê-lo.

---

## 1. Persistência

**DbClient** — instância única do Prisma Client (`lib/db/client.ts`), cacheada em
`globalThis` em desenvolvimento (padrão Next.js para evitar exaustão de conexões
em hot-reload).

**TenantDb** — a extensão já desenhada na arquitetura original (Client Extension
que injeta `organizationId` em todo `where`/`data` de modelo tenant-scoped) passa
de conceito para implementação. RLS no Postgres continua como segunda camada de
defesa, exatamente como decidido desde o primeiro documento de arquitetura — este
Blueprint não muda essa decisão, só a executa.

**Repository Pattern pragmático** — confirmando ADL-009: cada domínio ganha um
`infra/{dominio}.repository.ts` com funções nomeadas por intenção
(`buscarClientePorTelefone`, `listarProfissionaisAtivos`) que envolvem `tenantDb`.
Nunca uma classe `Repository` formal — o arquivo existe para trocar estratégia de
query num lugar só (ex: adicionar cache depois), não para simular uma abstração
de ORM que o Prisma já resolve.

**Transaction Scope** — todo Application Service que hoje executa "mais de uma
escrita conceitual" precisa de `prisma.$transaction`:
- `remarcarAppointment` (cancelar + criar) — já tem um `TODO` explícito sobre
  isso; aqui ele se resolve.
- `pagarComissao` (criar `CommissionPayout` + N `CommissionPayoutItem`).
- `fecharCaixa` (ler saldo + criar `CashClosing`) — leitura+escrita precisa de
  isolamento para não fechar caixa com dado sendo escrito ao mesmo tempo.

**Soft Delete** — **não existirá um campo genérico `deletedAt`.** Cada domínio já
tem o campo certo, nomeado com o significado dele: `archivedAt` (Cliente),
`terminatedAt` (Profissional), `discontinuedAt` (Serviço/Bundle). Um `deletedAt`
genérico seria um passo atrás — perderia o significado de domínio que Temporal
Truth e Explicit Domain Rules já garantiram. Nenhuma mudança necessária aqui, só
confirmação de que o padrão já estava certo.

**Audit Fields** — `createdAt` já existe na maioria dos modelos. Modelos que
sofrem edição real (Cliente, Profissional, Serviço — não os financeiros, que são
imutáveis por design) ganham `updatedAt` + `updatedByMembershipId`. O "quem fez
o quê" detalhado vive no `AuditLog` (seção 4), não duplicado aqui — Single Owner:
a entidade guarda só o estado atual e a última edição rápida de exibir; o
histórico completo é do `AuditLog`.

**Migrações** — como nenhuma migration real foi rodada até agora (todo o schema
foi editado como texto), a primeira ação prática é `prisma migrate dev --name
init`, capturando tudo já decidido nas 6 rodadas de domínio como uma única
baseline limpa. Vantagem inesperada de não ter conectado banco antes: não existe
histórico de migration confuso para reconciliar.

## 2. Authentication

**Auth.js v5**, confirmando a ADR original. Dois realms: staff (via `Membership`)
e portal do cliente (via `CustomerUser`, telefone + código, sem senha — decisão já
registrada na arquitetura original).

**Modelos exigidos pelo Auth.js** (adapter Prisma): `Account`, `Session`,
`VerificationToken` — novos, específicos de autenticação, não confundir com os
modelos de domínio. `User` já existe no schema; precisa alinhar nomes de campo à
convenção do adapter.

**Session** carrega `userId` + `activeOrganizationId` (um usuário pode ter
`Membership` em mais de uma organização — trocar de organização ativa é o que o
`WorkspaceSwitcher`, ainda não conectado de verdade, vai finalmente fazer).

**Role** — os 5 papéis já existentes (`StaffRole`) bastam para V1.

**Permission** — **não será modelada como entidade separada agora.** Uma tabela
`Permission` com relação N:N para `Role` seria generalização sem evidência —
nenhum caso real pediu granularidade abaixo de "papel" ainda. Fica registrada como
dívida aceita (Platform Discovery: promove quando houver evidência, não antes).

**Impersonation** — sessão elevada, nunca silenciosa: banner permanente na UI
("você está atuando como X"), e toda ação durante impersonation grava no
`AuditLog` **os dois IDs** — quem realmente está agindo e quem está sendo
impersonado. Single Owner: o `AuditLog` é o único lugar que sabe a diferença entre
"o que a tela mostra" e "quem realmente apertou o botão".

**Refresh** — resolvido nativamente pelo Auth.js (rotação de JWT ou sessão de
banco deslizante). Nenhum mecanismo próprio.

## 3. Authorization

**Regra central, já anunciada:** nenhum `organizationId` chega mais como
parâmetro confiável vindo do cliente. Toda Server Action começa com:

```ts
const { organizationId, membership } = await requireAuth();
requireRole(membership, ["OWNER", "ADMIN"]); // quando a ação exige
return cadastrarCliente(organizationId, values); // Application Service inalterado
```

O Application Service **não muda uma linha** — ele sempre recebeu
`organizationId` como primeiro parâmetro; a única mudança é *de onde* esse valor
vem. Isso é a validação prática de uma disciplina que vinha sendo seguida desde
Cliente sem essa justificativa estar totalmente explícita ainda.

## 4. Audit Trail

**`AuditLog`** (novo modelo): `id`, `organizationId`, `userId`,
`impersonatedByUserId?`, `action` (string — mesmo nome de evento já usado em todo
`emitirEvento()` de cada domínio, ex: `"cliente.cadastrado"`), `entityType`,
`entityId`, `payload` (Json), `ipAddress`, `userAgent`, `correlationId?`,
`createdAt`.

**Validação importante:** `emitirEvento()` — o placeholder de `console.log`
espalhado por todo domínio construído até aqui — **já tem exatamente a forma
certa** (nome do evento + payload). A migração é trocar o corpo da função por
`await prisma.auditLog.create(...)`, em um lugar só. Nenhum Application Service
precisa saber que isso mudou.

Fatos financeiros imutáveis (`Transaction`, `CommissionPayout`, `CashClosing`)
recebem `AuditLog` **além** da própria imutabilidade — dois conceitos diferentes:
o ledger é o fato de negócio ("o que aconteceu com o dinheiro"); o `AuditLog` é a
trilha técnica ("quem, de onde, quando").

## 5. Observability

**Structured Logging** — JSON, nunca string livre (já era o princípio, cap. 18.1;
aqui ele ganha implementação real).

**Error Tracking** — captura de exceção não tratada em toda Server Action.

**Performance** — Web Vitals já cobertos pela infraestrutura de hospedagem.

**Request Id / Correlation Id — achado de nomenclatura a resolver:** o domínio já
usa `correlationId` com um significado específico (ligar `AppointmentCancelled` a
`AppointmentScheduled`, ou um `CommissionPayout` ao ajuste que o corrige). O id de
rastreamento de infraestrutura (uma requisição HTTP inteira) é um conceito
diferente e **não deve reusar o mesmo nome** — proponho `requestId`/`traceId`
para o conceito de infraestrutura, mantendo `correlationId` exclusivo do
significado de domínio já estabelecido. Pequena decisão, mas evitar a colisão
agora é mais barato que desambiguar depois.

**Tracing distribuído** (OpenTelemetry) — adiado para a Fase 4 (Scale). Não há
evidência de necessidade com a topologia atual (um app, um banco).

**Health Check** — `/api/health`, verifica conectividade com banco e dependências
críticas.

**Metrics** — contadores básicos (requisições/erros/latência) via o provedor de
observabilidade escolhido, não construído do zero.

## 6. Configuration

**Environment** — validado no boot via schema (falha rápido se faltar variável,
não silenciosamente em produção).
**Secrets** — nunca em código; variáveis de ambiente do provedor de hospedagem.
**Feature Flags** — por organização; começa como um campo `Json` em
`Organization`, não um serviço de flags dedicado (Platform Discovery: sem
segundo caso de uso real ainda, não constrói motor).
**Storage** — Supabase Storage (ADR-04 original).
**Email** — Resend (stack original).
**WhatsApp** — Evolution API → Meta Cloud API (ADR-05 original), sem mudança.
**Payments** — fora deste Blueprint; pertence à Fase 4 (Financeiro Sprint 3).

## 7. Storage

**Upload/Images/Documents** — a Upload Engine (`_upload-engine.ts`) já foi
desenhada com o `transport` **injetado por dependência** desde a Onda 3e,
especificamente para este momento: a migração é implementar a função de
transporte real (Supabase Storage), **zero mudança na engine em si.** Validação
direta de uma decisão de design tomada há muitas rodadas.

**Buckets** — prefixo por organização dentro de buckets compartilhados
(`org-{id}/prontuario/...`), não um bucket por organização — mais simples de
operar, isolamento garantido por path + política de storage.

**Assinaturas/URLs temporárias** — TTL curto para conteúdo privado (fotos de
prontuário, comprovantes financeiros), já antecipado como requisito de LGPD desde
a arquitetura original.

## 8. Migration Plan

Ver documento dedicado (arquivo próprio). Resumo: como todo `TODO:
tenantDb(...)` já documenta exatamente a chamada Prisma esperada, a migração é
mecânica, domínio por domínio, sem mudança de API pública.

## 9. Risk Analysis

Ver Infrastructure Risk Matrix (arquivo próprio).

## 10. Release Strategy

Adota a sequência de fases 3.1–3.5 recomendada, que reconcilia com a estrutura
Sprint A-E do pedido original: 3.1 (Persistência) ⊇ Sprint A+D, 3.2 (Auth+RBAC) =
Sprint B+C, 3.3 (Audit) = parte do Sprint C/D, 3.4 (Observabilidade) = complemento,
3.5 (Remover mocks) = Sprint E/Go Live. Detalhamento no Migration Plan.
