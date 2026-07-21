# Financial Responsibility Matrix
Studio OS · antes da implementação do Financeiro Sprint 1

---

| Conceito | Dono único | Como os outros consomem |
|---|---|---|
| **Preço negociado** | **Quote** (`valorTotal`) | Appointment lê uma vez, na criação, como snapshot (`priceCentsSnapshot`). Financeiro nunca lê o Quote diretamente — lê o snapshot do Appointment. |
| **Desconto concedido** | **Financeiro** | Fato registrado no momento do recebimento (diferença entre devido e recebido), nunca uma edição do preço do Quote. Derivado quando é só a diferença aritmética; explícito quando a razão importa (ex: "desconto por pagamento à vista"). |
| **Recebimento** | **Financeiro** (`Transaction`, `type: INCOME`) | Ninguém mais grava isso. Appointment só é *referenciado* por uma Transaction, nunca o contrário. |
| **Estorno** | **Financeiro** (`Transaction` nova, `reversalOfId` apontando para a original) | Immutable Financial Ledger: nunca edita a Transaction original. |
| **Comissão** | **Financeiro**, mas **derivada** até o pagamento | `priceCentsSnapshot × commissionRate` (Profissional) é cálculo, não dado armazenado. Só `CommissionPayout` (fora do Sprint 1) é fato persistido. |
| **Parcelamento** | **Financeiro**, escopo mínimo no Sprint 1 | Sprint 1 registra a forma de pagamento; parcelamento como conceito rico (N parcelas com vencimento próprio) é Sprint 3/Integrações — fora de escopo agora, não modelado em profundidade ainda. |
| **Gateway** | **Nenhum domínio ainda — não existe.** | Fora do MVP desde a ADR-10 original. Quando existir, será um adaptador de transporte (mesmo padrão do `WhatsAppProvider`), nunca dono de preço. |
| **Nota fiscal** | **Nenhum domínio ainda — não existe.** | Fase 2/Sprint 3 ou posterior. Quando existir, consome `Transaction` como fonte, nunca gera valor próprio. |
| **Conciliação** | **Financeiro** (`reconciledAt` já reservado no modelo, não operado no Sprint 1) | Campo existe desde a modelagem para não exigir migração depois; o *processo* de conciliar (bancária/gateway) é integração futura. |
| **Inadimplência** | **Derivada — não é dono de ninguém.** | `saldoDevedor(appointment) = priceCentsSnapshot − soma(Transactions vinculadas não estornadas)`. Se > 0 após a data esperada, é uma pendência — Specification, não status persistido. |

## Confirmação dos quatro princípios aplicados linha a linha

- **Single Owner Principle:** cada linha tem exatamente um dono; onde dois domínios
  parecem disputar (preço vs. desconto), a fronteira está explícita na coluna
  "como os outros consomem".
- **Financial Source of Truth:** "Preço negociado" nunca aparece como propriedade
  do Financeiro — é a primeira linha da matriz, deliberadamente, para não deixar
  dúvida.
- **Snapshot Principle:** a linha "Recebimento" e a nota sobre `descriptionSnapshot`
  (já detalhada na modelagem) são a aplicação prática.
- **Derived Over Stored:** "Comissão" e "Inadimplência" são as duas linhas onde a
  tentação de persistir um valor calculável é maior — ambas marcadas
  explicitamente como derivadas.

---

Pronta para a implementação do Financeiro Sprint 1.
