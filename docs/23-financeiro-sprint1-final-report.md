# Financeiro — Sprint 1
Relatório final: Domain Validation Report + Interaction Matrix + Release Gate + ADL + listas exigidas

---

## 1. Financial Domain Validation Report

### Fidelidade ao modelo
Mantido integralmente. A decisão mais importante da modelagem — eliminar a tabela
`Commission` e derivar tudo até o pagamento — se confirmou na implementação sem
nenhum ajuste: `comissaoDevida()` é uma função pura de uma linha, nenhuma tabela
nova precisou existir.

### Componentes de plataforma exercitados
`Card`, `Badge`, `Button`, `IconButton`, `EmptyState`, `Skeleton`, `QuickCreate`,
`Field`, `Combobox`, `CurrencyInput`, `Dropdown`, `ConfirmationDialog`, `Toast`,
`Breadcrumb`, `TopbarSlot`. **Primeira integração real do `Select`** (formas de
pagamento — lista curta e estática, exatamente o caso de uso documentado desde a
Onda 3b) e do **`Dropdown`** em contexto de ação sobre linha de lista (estornar).

### Financial Source of Truth — auditoria
Nenhuma função do domínio recalcula preço. `registrarRecebimento` recebe o valor
como fato (o que foi efetivamente cobrado), nunca deriva de `Quote`/`Service`.
`descontoConcedido` é calculado a partir da diferença entre o snapshot do
Appointment e o recebido — nunca escreve de volta no Quote ou no Appointment.

### Immutable Financial Ledger — auditoria
`registrarEstorno` cria uma nova `Transaction` com `reversalOfId`; não existe
`atualizarTransacao` em lugar nenhum do código. O schema não tem `updatedAt` em
`Transaction` — ausência deliberada, sinal estrutural de que edição não é
esperada.

### Temporal Truth / Derived Over Stored — auditoria
`reconciledAt` reservado, não operado (fora de escopo do Sprint 1, como definido).
Nenhum boolean temporal novo. Saldo de caixa, saldo devedor, comissão devida e
desconto concedido — todos funções puras, nenhum armazenado.

### SaaS Readiness
`organizationId` primeiro parâmetro em `registrarRecebimento`, `registrarEstorno`,
`listarTransacoesDoDia`, `listarPendencias`, `listarCategorias` — sexto domínio
seguido sem repetir o achado original de Cliente. `TransactionCategory` é por
organização, nunca enum fixo.

### Lições aprendidas
1. **Cross-Domain Insight de verdade, não só classificado — produzido.** "3
   atendimentos concluídos sem recebimento" (Operating Center) é o primeiro
   Decision Card desta série que cruza dado de dois domínios *na implementação*,
   não só na teoria do capítulo 36 — `listarPendencias` literalmente junta
   `Appointment` (mock) com `Transaction` (mock) e aplica a Specification.
2. **A ausência de novos componentes de plataforma neste sprint não é um
   acidente — é a prova do ADL-100 funcionando.** Todo overlay, todo primitivo,
   toda peça de layout já existia. Isso é exatamente o que "nenhuma nova
   fundação" deveria produzir quando a plataforma está madura de verdade.

---

## 2. Interaction Matrix (atualizada)

| Domínio | Cliente | Profissional | Serviço | Consulta | Quote | Appointment | **Financeiro** |
|---|---|---|---|---|---|---|---|
| Agenda | ✅ | ✅ | ✅ | ✅ | ✅ | — | ❌ (não lê Financeiro na criação) |
| **Financeiro** | ❌ | ✅ (comissão, derivada) | ❌ | ❌ | ❌ | ✅ (`priceCentsSnapshot`) | — |
| Operating Center | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ (via pendências) | ✅ |

Nenhuma dependência ausente. Financeiro não depende de nada que não estivesse
maduro (Appointment, Profissional).

## 3. Release Gate

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Fundação crítica em Preview? | Não |
| 2 | Engine bloqueando consumidores? | Não |
| 3 | Regressão visual? | Não avaliada por execução real (mesma ressalva de sempre) |
| 4 | Regressão de acessibilidade? | Não — nenhum primitivo alterado |
| 5 | Regressão de API? | Não — `Select`/`Dropdown` usados exatamente como documentado |
| 6 | Regressão de performance? | Não, por leitura de código |
| 7 | Dependência de domínio ausente? | Não — Interaction Matrix confirma |

**Aprovado.**

## 4. Atualização do ADL

### ADL-101 — Commission eliminada como tabela, Financeiro nasce 100% derivado até o payout
**Contexto:** a modelagem original da arquitetura previa uma tabela `Commission`
por atendimento.
**Decisão:** eliminada antes de existir — comissão devida é sempre
`priceCentsSnapshot × commissionRate`, calculada sob demanda; só `CommissionPayout`
(Sprint 2) será fato persistido.
**Consequência:** confirma, pela quarta vez nesta série (depois de
`sessionsRemaining`, `requiresConsultation`, `EXPIRADO`), que aplicar Derived Over
Stored *durante a modelagem* elimina entidades inteiras antes que precisem de
correção depois.

## 5. Componentes reutilizados da plataforma

`Card`, `Badge`, `Button`, `IconButton`, `EmptyState`, `Skeleton`, `QuickCreate`,
`Field`, `Combobox`, `CurrencyInput`, `Select`, `Dropdown`, `ConfirmationDialog`,
`Toast`, `Breadcrumb`, `TopbarSlot`, `SidebarNav`, `CommandPalette`,
`DecisionCard`/`DecisionBlock`. **19 componentes, zero criados.**

## 6. Componentes novos promovidos

**Nenhum.** Primeiro Sprint da série inteira sem nenhuma promoção nem extração —
confirmação direta do ADL-100 ("nenhuma nova fundação").

## 7. Decisões arquitetônicas tomadas durante a implementação

1. Eliminação da tabela `Commission` (ADL-101).
2. `Transaction.amount` (Decimal) virou `amountCents` (Int) — alinhamento com a
   convenção de centavos já usada em `CurrencyInput`/`Appointment.priceCentsSnapshot`
   desde a Onda 3a; um `Decimal` solto teria sido a única grandeza monetária fora
   do padrão em toda a plataforma.
3. `Transaction.category: String` virou `categoryId` com relação para
   `TransactionCategory` — Catalog Over Logic/Explicit Domain Rules aplicado
   retroativamente a um campo que nasceu como texto livre na arquitetura original.
4. Correção de um fragmento de schema órfão (resquício da remoção de
   `AppointmentService`, sessão anterior) — encontrado ao editar a região vizinha,
   corrigido de passagem.

## 8. Checklist de SaaS Readiness — Financeiro

```
☑ organizationId primeiro parâmetro em todo Application Service
☑ TransactionCategory por organização, nunca enum fixo da plataforma
☑ Nenhum valor monetário hardcoded de negócio no domínio (vive só no seed)
☑ Nenhuma regra acoplada à Casa Nataly especificamente
☑ Immutable Ledger — nenhuma operação de update exposta
☐ Multi-moeda — fora de escopo (BRL fixo), aceitável para o mercado-alvo atual,
   registrado para não ser esquecido se o SaaS expandir para fora do Brasil
```

---

## Veredito

Financeiro Sprint 1: **concluído, Domain Pipeline completo.** Próximo: Financeiro
Sprint 2 (Comissões/CommissionPayout), conforme a sequência definida.
