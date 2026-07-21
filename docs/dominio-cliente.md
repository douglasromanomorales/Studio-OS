# Domínio: Cliente
Studio OS · Modelagem DDD antes de qualquer implementação

> ⚠️ **Inconsistência arquitetural encontrada durante a modelagem — implementação
> interrompida conforme a regra.** Ver seção 9 antes de qualquer código: o schema
> atual tem **duas fontes de verdade para o Teste de Mechas** (`Customer.strandTestDone`
> e `Consulta.testeMechasFeito`), e isso é exatamente o tipo de bug de domínio que a
> modelagem existe para pegar antes que vire dado corrompido em produção.

---

## 1. O que é um Cliente

Uma pessoa que se relaciona com **uma organização** para consumir serviços de beleza
e bem-estar. Três decisões de fronteira que definem tudo:

1. **Cliente existe antes do primeiro atendimento.** A pessoa que mandou fotos pelo
   WhatsApp pedindo orçamento já é um Cliente (a Consulta referencia um Cliente,
   nunca cria uma "pessoa avulsa"). Não existe entidade "Lead" separada — lead é um
   *estado derivado*, não outro tipo.
2. **Cliente é por organização, nunca global.** A mesma pessoa física em dois salões
   do SaaS são dois Clientes distintos, sem vínculo. Identidade cross-tenant seria
   uma mina terrestre de LGPD (um salão enxergando histórico de outro) — a ponte
   futura é o `CustomerUser` do Portal, que *a própria pessoa* controla, nunca o
   sistema por trás dela.
3. **Cliente não é o prontuário.** Dados cadastrais/relacionais (este domínio) têm
   ciclo de vida e regras de acesso diferentes de dados clínicos (domínio Prontuário,
   acesso restrito por papel, retenção própria). Fronteira de agregado, não de tabela.

## 2. Ciclo de vida e estados

**Decisão central: estados operacionais são derivados, nunca colunas.**

```
        (derivados — Specifications, nunca persistidos)
  LEAD ──────► ATIVO ──────► EM RISCO ──────► INATIVO
  sem            ≥1            sem retorno      sem retorno além
  atendimento    atendimento   no padrão dela   do padrão + margem

        (persistidos — decisões explícitas, com evento)
  ─────► ARQUIVADO ─────► ANONIMIZADO (LGPD, irreversível)
```

Por quê: "inativo" depende do padrão de retorno *daquela cliente* (quem faz bronze
volta em 15 dias; quem faz mecha, em 4 meses). Persistir isso como status vira dado
mentiroso no dia seguinte. `ARQUIVADO` e `ANONIMIZADO` são os únicos estados
armazenados porque são decisões humanas/legais, não cálculos.

## 3. Agregado, Entidades e Value Objects

### Agregado `Cliente` (raiz: Customer)

```
Cliente (Aggregate Root)
├── Identidade: id, organizationId (invariante: imutáveis)
├── VO Nome
├── VO Telefone            ← identidade prática (WhatsApp), normalizado E.164,
│                             ÚNICO por organização (invariante do agregado)
├── VO Email (opcional)
├── VO Instagram (opcional)
├── VO DataNascimento (opcional — aniversário move Marketing)
├── VO Endereco (opcional)
├── VO ConsentimentoLGPD   ← versão do termo + timestamp + canais opt-in/opt-out
├── Tags: TagCliente[]     ← entidade filha (VIP manual, "gestante", etc.)
├── RegistroTesteMechas[]  ← entidade filha (ver seção 9 — a correção)
└── archivedAt / anonymizedAt
```

**Fora do agregado (referenciam Cliente por id, ciclos de vida próprios):**
Consulta, Appointment, Prontuário (Record), CustomerPackage, Transaction,
CustomerUser (credencial do Portal). Regra de ouro: nenhum deles é carregado ou
salvo "junto" com Cliente numa transação do agregado.

### Value Objects — regras embutidas no tipo, não espalhadas em ifs

| VO | Invariante |
|---|---|
| `Telefone` | Só dígitos, normalizado com DDI (E.164). Igualdade por valor normalizado — "(13) 97413-9126" e "5513974139126" são o mesmo telefone |
| `ConsentimentoLGPD` | Imutável; revogação cria novo registro, nunca sobrescreve (trilha de auditoria é o próprio histórico) |
| `Nome` | Não-vazio, trim, sem invariante de formato (nomes reais são bagunçados — não validar demais) |
| `DataNascimento` | Data completa opcional; se presente, no passado |

## 4. Eventos de domínio

| Evento | Emitido quando | Consumidores |
|---|---|---|
| `cliente.cadastrado` | Criação (inclusive via QuickCreate na Consulta) | Auditoria, métricas de aquisição |
| `cliente.atualizado` | Mudança cadastral | Auditoria |
| `cliente.consentimento_registrado` / `revogado` | Opt-in/out de canal | Marketing (bloqueio imediato de envio), Auditoria |
| `cliente.teste_mechas_registrado` | Resultado de teste registrado | Consultas (destrava orçamentos), Agenda (destrava agendamento de química) |
| `cliente.arquivado` / `cliente.anonimizado` | Decisão explícita / LGPD | Todos os módulos (some das buscas), Auditoria |

Naming segue o cap. 18.3 do Design Language (`entidade.evento`, pt-BR, snake).
Eventos derivados (ex: "cliente ficou inativo") **não existem como evento de
domínio** — inatividade é uma Specification avaliada por quem pergunta (Dashboard,
IA), não um fato que aconteceu num instante.

## 5. Regras que pertencem × não pertencem ao domínio

**Pertencem:** unicidade de telefone por organização · consentimento obrigatório
antes de qualquer comunicação de marketing (o domínio *bloqueia*, o Marketing
*pergunta*) · anonimização preserva agregados financeiros e apaga PII · teste de
mechas é fato do Cliente com validade no tempo (seção 9) · arquivado não aparece em
busca padrão.

**NÃO pertencem (e onde vivem):** disponibilidade/agendamento (Agenda, orquestrador) ·
precificação (Serviços/Orçamentos) · dados clínicos e fotos de procedimento
(Prontuário) · saldo de sessões (Pacotes) · "quanto gastou" (Financeiro — Cliente
nunca guarda um total; VIP por gasto é uma *Policy* que consulta o Financeiro).

## 6. Specifications e Policies

- `ClienteInativo(padrãoDeRetorno)` — Specification: sem atendimento além do
  intervalo típico dela + margem. É a query por trás do DecisionCard "12 clientes
  costumam retornar neste período".
- `AniversarianteDaSemana` — Specification simples.
- `ClienteVIP` — **Policy configurável por organização** (gasto acumulado, frequência,
  ou marcação manual via Tag). Nunca um boolean no Cliente: o critério de VIP da Casa
  Nataly não será o do próximo tenant do SaaS.

## 7. Serviços

- **Application Services** (Server Actions, na prática): `cadastrarCliente`,
  `atualizarCliente`, `registrarConsentimento`, `registrarTesteMechas`,
  `arquivarCliente`, `anonimizarCliente` (workflow LGPD: valida pendências
  financeiras → apaga PII → mantém agregados → emite evento).
- **Domain Service:** `DetecçãoDeInatividade` — cruza Cliente com histórico de
  atendimentos (outro agregado), por isso não vive dentro do agregado. Na prática é
  um read-model/query, executado pelo cron de insights.
- **Repository:** `ClienteRepository` tenant-scoped — na prática, o `tenantDb` já
  definido na arquitetura, com os métodos de intenção (`buscarPorTelefone`,
  `buscarAniversariantes`) como funções nomeadas, não queries soltas espalhadas.

## 8. Evolução para SaaS multiempresa

Já embutida nas decisões acima: cliente por organização (decisão 1.2), VIP como
policy por tenant (6), consentimento versionado por tenant, unicidade de telefone
*por organização* (a mesma pessoa pode ser cliente de dois salões). O único ponto
futuro que exigirá modelagem nova é o Portal unificado (uma pessoa vendo seus dados
em N salões) — resolvido via `CustomerUser` como agregado próprio do realm Portal,
nunca mexendo neste domínio.

---

## 9. ⚠️ Inconsistência encontrada — implementação interrompida

**Problema:** o schema atual guarda o Teste de Mechas em dois lugares:
`Customer.strandTestDone: Boolean` e `Consulta.testeMechasFeito: Boolean`. Duas
fontes de verdade para o mesmo fato = inevitável divergência (consulta diz que fez,
cadastro diz que não). Pior: um boolean sem data é um dado errado por design — teste
de mechas **expira na prática** (cliente fez química em outro salão depois do teste?
O resultado antigo não vale mais).

**Alternativas avaliadas:**
1. Manter boolean no Customer, remover da Consulta — simples, mas perde validade
   temporal e histórico.
2. Mover para o Prontuário — semanticamente defensável (é um fato clínico), mas o
   Prontuário é módulo futuro e a Consulta precisa disso *agora*; criaria dependência
   invertida na ordem do roadmap.
3. **Entidade filha `RegistroTesteMechas` no agregado Cliente** (data, resultado,
   observação, validadeAté opcional) — a Consulta pergunta "existe teste válido?",
   nunca guarda a resposta. Quando o Prontuário nascer, ele referencia esses
   registros, não os substitui.

**Decisão: alternativa 3.** Correção de schema decorrente (a aplicar na
implementação): remover `Customer.strandTestDone` e `Consulta.testeMechasFeito`;
criar `StrandTestRecord` sob Customer; `Consulta.precisaTesteMechas` permanece (é
uma exigência derivada da regra, não o fato do teste).

---

## 10. Relatório de validação

**Decisões arquiteturais:** estados derivados via Specification (nunca colunas de
status operacional) · teste de mechas como registro temporal no agregado Cliente ·
VIP como Policy por tenant · cliente por organização sem identidade global ·
fronteira Cliente ≠ Prontuário.

**Eventos:** 7 eventos de domínio (seção 4), consumidores mapeados.

**Responsabilidades:** seção 5 — com a lista explícita do que o domínio *recusa*.

**Integrações/dependências:** Consultas (já existe — vai consumir
`RegistroTesteMechas`), Marketing (consentimento como gate), IA/Dashboard
(Specifications de inatividade/aniversário), Financeiro (fonte da Policy VIP),
Portal (futuro, via agregado próprio).

**Riscos:** (a) migração dos booleans existentes para `StrandTestRecord` — baixo,
dado mock ainda; (b) Specification de inatividade depende de histórico de
atendimento que só existe de verdade pós-Agenda — até lá, o DecisionCard usa
heurística simples e documentada; (c) tentação de "só um boolean VIP por enquanto" —
recusada de propósito, é o tipo de atalho que custa uma migração multi-tenant depois.

**Reutilização:** `Telefone`, `ConsentimentoLGPD` e o padrão
Specification/Policy servem igualmente a Profissionais (próximo domínio) e a
qualquer produto CodeChain com pessoas + LGPD.

**Recomendação pragmática de implementação (a ressalva de DDD):** viram **código
estrutural** — VOs `Telefone`/`ConsentimentoLGPD` (funções puras de
normalização/validação, testáveis como as engines), Application Services como Server
Actions nomeadas, eventos como registros na tabela de outbox/auditoria,
Specifications como funções de query nomeadas. Viram **convenção documentada, não
classe** — Factory (o `create` do Prisma com validação Zod já é a fábrica),
Repository formal (o `tenantDb` + funções de intenção já cumprem o papel). Motivo:
em TypeScript + Prisma, a camada extra de classes-repositório duplica o que o ORM
tipado já garante, sem adicionar invariante nenhuma — cerimônia sem proteção.
