# Domínio: Financeiro
Studio OS · primeiro domínio da Fase 2 (Business) · modelagem antes de qualquer código

---

## 1. Entidades que pertencem ao Financeiro

- **Transaction** (Aggregate Root) — o fato de dinheiro ter entrado ou saído.
- **TransactionCategory** — plano de contas, por organização (SaaS First — nunca
  enum fixo da plataforma; cada salão organiza suas categorias diferente).
- **CommissionPayout** — o fato de uma profissional ter sido paga por um período.

**Decisão que elimina uma entidade que a arquitetura original previa:** não existe
tabela `Commission` própria por atendimento. "Quanto uma profissional deve de
comissão" é sempre **derivado** (seção 6) — só o *pagamento efetivo* é persistido
(`CommissionPayout`), nunca o valor devido antes de ser pago.

## 2. O que pertence ao Financeiro

Recebimentos, estornos, descontos concedidos (como fato registrado, não como
renegociação de preço — seção 3), forma de pagamento, parcelamento, conciliação,
plano de contas, pagamento de comissão.

## 3. O que pertence ao Quote — Financial Source of Truth em ação

O **valor negociado** é e continua sendo propriedade exclusiva do Quote
(`valorTotal`, já modelado). O Financeiro nunca reabre essa negociação. Quando um
recebimento é menor que o valor devido, o Financeiro registra a diferença como
**desconto concedido no momento do recebimento** — um fato novo, paralelo, não uma
edição retroativa do que o Quote definiu. O preço "oficial" nunca muda; o que
mudou é quanto foi efetivamente cobrado.

## 4. O que pertence ao Appointment

`priceCentsSnapshot` — o valor devido *daquele atendimento específico* (já
modelado, Snapshot Eligibility aplicado antes deste domínio existir). O Financeiro
lê esse valor como "o que era esperado", nunca o recalcula, nunca o duplica em
outro campo.

## 5. O que pertence ao Cliente

Nada estrutural. "Quanto o cliente já gastou" (usado pela Policy `ClienteVIP`,
domínio Cliente) é uma **leitura** que o domínio Cliente faz consultando
`Transaction`s do Financeiro — nunca um campo `totalGasto` armazenado em
`Customer` (Single Owner Principle: Financeiro é dono do dado transacional,
Cliente só consulta).

## 6. Informações derivadas (Derived Over Stored)

- **Saldo de caixa do dia/período** — soma de `Transaction`s, nunca coluna
  agregada.
- **Comissão devida a uma profissional, antes do pagamento** — derivada de
  `Appointment.priceCentsSnapshot × commissionRate` (Profissional) somada por
  período. Só vira fato persistido no momento do `CommissionPayout`.
- **Saldo devedor de um Appointment** — `priceCentsSnapshot − soma(Transactions
  vinculadas)`. Nunca armazenado; se chegar a zero, o atendimento está quitado.
- **Desconto total concedido no período** — soma das diferenças (seção 3), nunca
  um contador próprio.

## 7. Snapshots (Snapshot Eligibility aplicado, as três perguntas)

**`Transaction.descriptionSnapshot`** (ex: "Bronze Natural — Ana Paula Ferreira",
capturado no momento do recebimento): passa nas três perguntas do cap. 39 —
representa um documento entregue (recibo), precisa preservar o contexto textual
daquele recebimento específico, e um rename futuro do serviço/cliente não deveria
mudar um recibo já emitido. **É snapshot legítimo.**

**Nome de categoria (`TransactionCategory`) não é snapshot** — falha a pergunta 3:
renomear uma categoria do plano de contas não muda o significado de lançamentos
antigos (eles continuam pertencendo à mesma categoria, só com rótulo atualizado).
Fica como referência viva.

## 8. Eventos que o Financeiro consome

- `appointment.concluido` (Appointment) → habilita registrar `Transaction`
  vinculada; não cria automaticamente (a cobrança pode acontecer em momento
  diferente da conclusão do atendimento).
- `orcamento.aceito` (Quote) → informa expectativa de receita (Dashboard), não
  gera `Transaction` — dinheiro só é fato quando muda de mãos de verdade.
- `profissional.desligada` (Profissional) → fecha janela de comissões pendentes
  daquela profissional (regra já anunciada no domínio Profissional).
- `appointment.cancelado` (Appointment) → se já havia recebimento vinculado, sinaliza
  necessidade de estorno (decisão humana, não automática — gateway está fora do
  MVP desde a arquitetura original, ADR-10).

## 9. Eventos que o Financeiro produz

`financeiro.recebimento_registrado` · `financeiro.estorno_registrado` ·
`financeiro.comissao_paga` · `financeiro.conciliado`.

## 10. Decision Cards possíveis

- *"Entradas hoje: R$X"* — **Local** (só Financeiro).
- *"3 atendimentos concluídos sem recebimento vinculado"* — **Cross-Domain**
  (Appointment + Financeiro) — só o Financeiro, cruzando os dois, vê isso.
- *"R$X em comissões a pagar para 3 profissionais"* — **Cross-Domain**
  (Profissional + Appointment + Financeiro).
- *"Baseado no histórico, receita estimada da semana: R$X"* — **Predictive**,
  mesma família de `clienteInativo` (heurística hoje, IA na Fase 3).

## 11. Integrações futuras (não implementadas, espaço reservado)

Pix (registro manual de recebimento hoje; webhook de confirmação automática é
integração futura) · Nota Fiscal (fora do MVP, mesma decisão já registrada na
arquitetura original) · Gateway de pagamento (ADR-10 original: fora do MVP,
cobrança presencial) · Exportação para ERP externo · Conciliação bancária
automática (`reconciledAt` já nasce como campo — a automação de preenchê-lo é
integração futura, o dado já está modelado certo para recebê-la).

---

## Aplicação de todos os princípios existentes

| Princípio | Aplicação | Não se aplica? |
|---|---|---|
| **Temporal Truth** | `reconciledAt`, `refundedAt`/reversão via nova Transaction — nunca boolean `conciliado`/`estornado` | Aplica |
| **Snapshot Principle/Eligibility** | `descriptionSnapshot` (seção 7) | Aplica |
| **Derived Over Stored** | Saldo, comissão devida, saldo devedor, desconto total (seção 6) | Aplica |
| **Single Owner Principle** | Quote possui preço negociado; Appointment possui snapshot devido; Financeiro possui o que foi recebido — três donos, nunca duplicado | Aplica |
| **Catalog Over Logic** | `TransactionCategory` é dado, nunca string comparada para decidir comportamento | Aplica |
| **Capability Provenance** | **Não se aplica diretamente.** Este princípio é sobre *quem pode executar o quê* (profissional × serviço). Financeiro não tem um conceito de "capacidade" análogo — controle de acesso a dado financeiro é RBAC (`Membership.role: FINANCE`, já definido na arquitetura original), não uma nova mecânica de proveniência. |
| **Domain Readiness** | Depende de Appointment (Stable) e Quote (liberado) — ambos maduros, Financeiro pode começar | Aplica |
| **Workflow Before UI** | Este documento é a prova — nenhuma tela antes da modelagem | Aplica |
| **Platform Discovery** | Ainda não testado — só se aplica no momento em que código/UI for escrito; registrado aqui como compromisso, não como evidência ainda | Aplica na implementação, não na modelagem |
| **Coordination over Ownership** | Financeiro referencia `appointmentId` por id, nunca duplica dado do Appointment além do snapshot já existente lá (não cria um segundo snapshot) | Aplica |
| **Financial Source of Truth** (novo) | Todo o domínio nasce sob este princípio — seção 3 é a aplicação central | Aplica, é o motivo do domínio existir |

---

## Riscos

1. **Registrar `Transaction` sem vínculo a `Appointment`** (ex: uma despesa de
   aluguel) é legítimo — `appointmentId` precisa ser opcional, não obrigatório.
   Risco de alguém assumir que todo lançamento financeiro nasce de um atendimento;
   não nasce.
2. **Estorno como nova Transaction, não edição** — consistente com o padrão já
   usado em `AppointmentCancelled`+`Scheduled`, mas exige disciplina de query (soma
   de `Transaction`s de um Appointment precisa considerar reversões, não só somar
   tudo cegamente).
3. **Comissão totalmente derivada até o payout** é elegante, mas exige que o
   cálculo (`priceCentsSnapshot × commissionRate`) seja consistente entre a tela
   que mostra "quanto devo" e o momento real do `CommissionPayout` — qualquer
   mudança de regra de comissão no meio do caminho precisa de teste cobrindo isso.

---

Aguardando aprovação desta modelagem antes de iniciar a implementação.
