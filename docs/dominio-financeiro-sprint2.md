# Domínio: Financeiro — Sprint 2
CommissionPayout, fechamento de período, fechamento de caixa · modelagem antes de qualquer código

> **Achado ao modelar o ciclo completo, corrigindo uma decisão do Sprint 1:**
> `comissaoDevida()` calculava `priceCentsSnapshot × rate` — o valor **devido**,
> não o **recebido**. Isso pagaria comissão sobre inadimplência. Corrigido nesta
> modelagem, antes de o Sprint 2 nascer com o bug: comissão deriva de
> `totalRecebidoDoAppointment` (já existe, Sprint 1 — Platform Discovery passo 1,
> reutiliza), nunca do snapshot de preço.

---

## 1. Ciclo completo da comissão

```
Appointment (DONE, priceCentsSnapshot)
        │
        ▼
Transaction (INCOME, vinculada ao Appointment) ──► pode haver Transaction de
        │                                           estorno depois (Sprint 1)
        ▼
CommissionCalculation — NÃO é entidade, é a Specification
  comissaoDevida = totalRecebidoDoAppointment(appointmentId) × commissionRate
  (Profissional). Avaliada sob demanda, nunca armazenada.
        │
        ▼
CommissionPayout — fato persistido: "paguei X à profissional Y, referente ao
  período Z, composto pelos atendimentos [...]" — com CommissionPayoutItem como
  snapshot de cada linha (seção 5).
        │
        ▼
Histórico — NÃO é entidade própria. É a query "todos os CommissionPayout de uma
  profissional, ordenados por data". O histórico é uma leitura, não uma tabela.
```

## 2. Financial Responsibility Matrix — Sprint 2

| Conceito | Dono único | Como os outros consomem |
|---|---|---|
| Valor devido por atendimento | **Appointment** (`priceCentsSnapshot`, já existe) | Financeiro nunca reescreve |
| Valor recebido por atendimento | **Financeiro** (`Transaction`, já existe) | Comissão deriva daqui, não do devido |
| Taxa de comissão | **Profissional** (`commissionRate`, já existe) | Financeiro consulta, nunca duplica |
| Cálculo de comissão (não paga) | **Ninguém — é Specification, não tem dono-entidade** | Avaliada sob demanda por quem perguntar |
| Fato de pagamento de comissão | **Financeiro** (`CommissionPayout`, novo) | Único registro persistido do ciclo |
| Fechamento de caixa | **Financeiro** (`CashClosing`, novo) | Decisão humana explícita, com timestamp |

## 3. Valores derivados (Derived Over Stored)

- Comissão devida por atendimento, por profissional, por período — sempre
  calculada, nunca coluna.
- `CommissionPayout.totalCents` — **derivado da soma de `CommissionPayoutItem`**,
  mesmo padrão já usado em `Orcamento.valorTotal` (Platform Discovery: o padrão já
  existe, reaproveitado, não reinventado).
- `CashClosing.differenceCents` — `countedCents − expectedCentsSnapshot`, nunca
  armazenado separadamente.
- Relatórios financeiros internos (DRE simplificado, ticket médio, faturamento por
  categoria) — 100% leitura agregada sobre `Transaction`, nenhuma tabela de
  relatório própria.

## 4. Fatos persistidos (Immutable Financial Ledger)

- **`CommissionPayout`** — o único fato do ciclo de comissão. Imutável: uma
  correção depois do pagamento é um **novo** `CommissionPayout` com valor negativo
  e `adjustsPayoutId` apontando para o original (seção 8) — nunca uma edição.
- **`CommissionPayoutItem`** — snapshot de cada atendimento que compôs o pagamento
  (seção 5), criado junto com o payout, nunca depois.
- **`CashClosing`** — o fato de "o caixa foi conferido e fechado", com quem fechou
  e quando. Nunca um boolean `caixaFechado` (Temporal Truth) — sempre um registro
  com timestamp, mesmo padrão de `archivedAt`/`terminatedAt`.

## 5. Snapshots (Snapshot Eligibility, as três perguntas aplicadas)

**`CommissionPayoutItem` passa nas três:** (1) representa um documento entregue à
profissional (o comprovante de pagamento) — sim; (2) precisa preservar o contexto
numérico daquele pagamento específico — sim; (3) uma mudança futura na taxa de
comissão da profissional alteraria o significado do que já foi pago — sim, e não
pode. Campos: `amountReceivedSnapshot`, `rateSnapshot`, `commissionAmountSnapshot`
por atendimento coberto.

**`CashClosing.expectedCentsSnapshot` também passa:** o valor esperado é calculado
*no momento do fechamento* e congelado ali — se uma `Transaction` for adicionada
depois (não deveria, mas o sistema não pode assumir isso), o fechamento já
registrado não muda retroativamente.

**Importante — isto não contradiz "nenhum cálculo intermediário poderá ser
salvo":** a proibição é sobre cachear um valor *ainda não decidido* (comissão
devida antes do pagamento, por exemplo). `CommissionPayoutItem` é o oposto — é o
retrato de uma decisão *já tomada e executada* (o pagamento aconteceu). Snapshot
de um fato consumado não é cálculo intermediário guardado por conveniência; é
histórico, exatamente o que o Snapshot Principle existe para proteger.

## 6. Eventos que entram

`financeiro.recebimento_registrado`, `financeiro.estorno_registrado` (Sprint 1) ·
`appointment.concluido` (habilita comissão a ser considerada) ·
`profissional.desligada` (força fechamento do período de comissão pendente dela).

## 7. Eventos que saem

`financeiro.comissao_paga` (já previsto desde a modelagem original do Financeiro) ·
`financeiro.caixa_fechado` (novo).

## 8. Como um estorno afeta uma comissão já paga

Duas situações, tratadas de formas diferentes:

- **Estorno acontece antes do payout do período:** o cálculo de comissão do
  período soma `Transaction`s líquidas (`INCOME` menos suas reversões) — o estorno
  já é absorvido naturalmente antes de qualquer pagamento existir. Nenhuma lógica
  especial.
- **Estorno acontece depois do payout já registrado:** isso é uma comissão paga a
  mais, de fato. Immutable Ledger não permite editar o `CommissionPayout` original.
  **Correção: um novo `CommissionPayout` com valor negativo, `adjustsPayoutId`
  apontando para o original** — mesmo padrão de `reversalOfId` em `Transaction` e
  `correlationId` em `Appointment`. O histórico mostra os dois registros; a soma
  dos dois é o valor líquido correto.

## 9. Como um desconto concedido altera a comissão

**Não precisa de nenhuma regra nova.** Porque a comissão deriva de
`totalRecebidoDoAppointment` (dinheiro que de fato entrou), um desconto já reduz
esse valor antes mesmo de a comissão ser calculada — é absorvido automaticamente
pela cadeia de derivação. Esta é a prova prática de que a correção da seção 1
(derivar de recebido, não de devido) era a decisão certa: se a comissão ainda
calculasse sobre `priceCentsSnapshot`, cada desconto exigiria uma regra de exceção
separada.

## 10. Como uma alteração retroativa deve ser tratada

Nunca como edição. "Retroativo" é sempre um **novo fato que referencia o passado**
— o mesmo padrão em toda a plataforma até aqui (reagendamento, estorno, e agora
correção de comissão). Não existe, e não deveria existir, um caminho de código que
faça `UPDATE` num `CommissionPayout`, numa `Transaction` ou num `CashClosing`.

---

## Aplicação dos 8 princípios obrigatórios

| Princípio | Aplicação |
|---|---|
| **Immutable Financial Ledger** | `CommissionPayout`/`CashClosing` só recebem INSERT; correção é sempre novo registro (seção 8, 10) |
| **Financial Source of Truth** | Comissão deriva de `Transaction` (o que aconteceu com o dinheiro), nunca de preço recalculado |
| **Derived Over Stored** | Comissão devida, `totalCents` do payout, `differenceCents` do fechamento — todos calculados, nunca coluna |
| **Snapshot Principle** | `CommissionPayoutItem`, `CashClosing.expectedCentsSnapshot` (seção 5) |
| **Temporal Truth** | Fechamento de caixa é registro com timestamp, nunca boolean |
| **Single Owner Principle** | Matriz da seção 2 — nenhum conceito com dois donos |
| **Workflow Before UI** | Este documento, antes de qualquer tela do Sprint 2 |
| **Platform Discovery** | `totalCents` derivado reaproveita o padrão já usado em `Orcamento` — nenhuma abstração nova inventada onde uma já resolvia |

## Confirmação: Commission continua não existindo

Nenhuma tabela `Commission`/`CommissionCalculation` nasce neste sprint. O único
fato persistido do ciclo inteiro é `CommissionPayout` (+ seu snapshot
`CommissionPayoutItem`, que é histórico de um pagamento já feito, não cálculo
intermediário — distinção explicada na seção 5).

---

Aguardando aprovação desta modelagem antes de implementar.
