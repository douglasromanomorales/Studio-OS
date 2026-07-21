# Interaction Matrix
Fronteiras entre domínios — revisão antes de iniciar a Agenda

---

## Matriz de consumo

| Domínio | Consome Cliente | Consome Profissional | Consome Serviço | Consome Consulta | Consome Quote | Consome Financeiro |
|---|---|---|---|---|---|---|
| **Agenda** (orquestrador, ainda bloqueada) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Consultas** | ✅ | ❌ | ✅ | — | ❌ | ❌ |
| **Quote** | ✅ (via Consulta) | ✅ | ✅ (via OrcamentoItem) | ✅ | — | ❌ |
| **Financeiro** | ✅ | ❌ | ✅ | ❌ | ❌ (consome Appointment, não Quote diretamente) | — |
| **Portal do Cliente** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (só vê recibos, não lança) |
| **Estoque** | ❌ | ❌ | ✅ (via ServiceProduct) | ❌ | ❌ | ❌ |

## O que cada domínio expõe (contrato de saída) para quem consome

| Domínio | Expõe | Nunca expõe |
|---|---|---|
| **Cliente** | Specifications (`clienteInativo`, `clienteEmRisco`, `existeTesteMechasValido`), dado cadastral | preço, disponibilidade de horário, regra de catálogo |
| **Profissional** | Specifications (`podeExecutarServico`, `profissionalAtiva`), disponibilidade declarada (`WorkingHours`/`ScheduleBlock`) | se um horário específico está livre *agora* (isso cruza com Appointment, que é da Agenda) |
| **Serviço** | `Requirements`, `PriceStrategy`, duração base | se uma profissional específica pode executá-lo (isso é `podeExecutarServico`, do domínio Profissional, que *consome* `Requirements` do Serviço) |
| **Consulta** | status do intake, histórico de avaliação | preço final (isso é Orçamento) |

## Confirmações — nenhum domínio assumindo responsabilidade alheia

- **Agenda não decide se uma profissional pode executar um serviço.** Ela chama
  `podeExecutarServico(profissional, servico)` (Profissional consumindo Requirements
  de Serviço) e usa o resultado. Confirmado nas modelagens dos dois domínios — nenhum
  dos dois importa o outro, ambos são chamados de fora.
- **Serviço não sabe o que é uma Consulta.** `requiresConsultation` é uma
  Specification pura sobre `PriceStrategy` — Consultas é quem *consome* essa resposta
  para decidir o fluxo de intake, nunca o contrário.
- **Financeiro não recalcula preço.** Consome o valor já resolvido no momento da
  venda (snapshot em Orçamento/Appointment), nunca reprocessa `PriceStrategy` do
  catálogo — evita que uma mudança de preço no catálogo altere retroativamente uma
  venda já fechada.
- **Estoque não conhece Cliente nem Profissional.** Só reage a `ServiceProduct`
  (consumo padrão de produto por serviço) — fronteira mínima, sem acoplamento
  desnecessário.

## Lacuna anterior — resolvida

Esta matriz, na sua primeira versão, identificou que Quote não existia e bloqueava
a Agenda. **Resolvida:** Quote implementado, com Domain Validation Report próprio
(`docs/18-domain-validation-quote.md` no `@codechain/ui`). O caminho completo
Consulta → Quote → Appointment agora tem todos os elos implementados:
`consulta.status === "AVALIADA"` → `Orcamento` criado → `orcamentoAceito`/
`prontoParaAgendamento` → Agenda pode consultar essa Specification sem implementar
nenhuma lógica própria.

## Liberação

Nenhuma dependência de domínio ausente para a Agenda neste momento. Pergunta 7 do
Release Gate ("existe dependência de domínio ausente?") responde **não** — a Agenda
está oficialmente liberada para desenvolvimento, conforme o Domain Pipeline exigia
como pré-condição.
