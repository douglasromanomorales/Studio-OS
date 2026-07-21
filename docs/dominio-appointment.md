# Domínio: Appointment
Studio OS · modelagem final antes da implementação da Agenda

> Este domínio já chega modelado em 90% pelo Agenda Orchestration Blueprint e pela
> Appointment Responsibility Matrix — o que falta aqui é formalizar isso em termos
> de Aggregate, invariantes e ciclo de vida, não redescobrir decisões já tomadas.

---

## 1. Responsabilidade do Aggregate

O Appointment é o registro de **um compromisso de horário entre uma profissional e
um cliente, para um serviço**. Sua única responsabilidade própria — confirmada duas
vezes agora (Blueprint e Matrix) — é garantir que esse compromisso não colida com
outro da mesma profissional. Tudo o mais que ele carrega é referência ou snapshot
de outro domínio (Coordination Over Ownership, cap. 37).

## 2. Invariantes

1. `startAt < endAt`, sempre.
2. Nenhum outro `Appointment` da mesma `professionalId` com intervalo
   `[startAt, endAt)` sobreposto, exceto o próprio (a única invariante que o
   Aggregate genuinamente protege sozinho).
3. `customerId`, `professionalId`, `serviceId` são imutáveis após criação — trocar
   qualquer um deles é cancelar e criar outro, nunca um `update` (evita um
   Appointment "migrar" de identidade e confundir histórico/auditoria).
4. `durationMinutesSnapshot` e `priceCentsSnapshot` são escritos uma vez, na
   criação, e nunca recalculados — Snapshot Principle, não invariante de
   consistência com o catálogo.

## 3. Ciclo de vida

```
SCHEDULED ──► CONFIRMED ──► DONE
    │              │
    └────► CANCELED ◄┘
                   │
                   └──► NO_SHOW   (só a partir de CONFIRMED)
```

Todas as transições são decisões humanas explícitas (recepção confirma, marca
concluído, cancela, marca não-comparecimento) — nenhuma é automática por horário.
`IN_PROGRESS`, como já decidido no Blueprint, não é estado: é a Specification
`atendimentoEmAndamento` (seção 6).

## 4. Snapshots necessários

Só dois — os mesmos já identificados na Responsibility Matrix, formalizados aqui:

| Snapshot | Fonte no momento da criação | Por quê é snapshot, não referência viva |
|---|---|---|
| `durationMinutesSnapshot` | `ProfessionalService.durationOverride` ?? `duracaoEstimada(orçamento)` ?? `Service.durationMinutes` | Um ajuste de duração no catálogo depois não deve mover o horário de um Appointment já marcado |
| `priceCentsSnapshot` | `Quote.valorTotal` (se houver orçamento) ou `resolvePriceStrategy(service).amountCents` (se FIXED) | Reajuste de preço no catálogo não altera o que já foi combinado com a cliente |

Nenhum outro dado do Appointment é snapshot — nome do cliente, nome da profissional
e nome do serviço são exibidos via `join`/consulta ao domínio dono, nunca copiados
(diferente de `OrcamentoItem.serviceNameSnapshot`, que existe porque um orçamento é
um documento comercial já entregue à cliente; um Appointment interno não precisa
dessa garantia de imutabilidade de texto).

## 5. Eventos que produz

`appointment.criado` · `appointment.confirmado` · `appointment.cancelado` ·
`appointment.concluido` · `appointment.no_show` — mesma lista do Blueprint, sem
`appointment.reagendado` como evento próprio: reagendar é `cancelado` + `criado`
novo (invariante 3 — identidade imutável), não uma transição especial.

## 6. Specifications que pertencem ao Appointment

Só as que operam sobre dado que ele mesmo possui:

- `haColisaoDeHorario(appointment, outrosAppointmentsDaMesmaProfissional)` — a
  invariante 2, exposta como função pura testável.
- `atendimentoEmAndamento(appointment, agora)` — `status === "CONFIRMED" && agora
  ∈ [startAt, endAt)`. Substitui o estado `IN_PROGRESS` que não existe mais.
- `podeConfirmar`/`podeCancelar`/`podeMarcarConcluido`/`podeMarcarNoShow` — guardas
  de transição de estado (seção 3), puras, testáveis sem banco.

**Não pertence ao Appointment** (mesmo operando sobre ele): se o cliente pode
agendar este serviço, se a profissional pode executá-lo — essas continuam sendo
Specifications de Cliente/Profissional/Serviço, só *chamadas* pelo Application
Service que cria o Appointment, nunca reimplementadas aqui.

## 7. Consultas que faz a outros domínios (na criação)

Exatamente a sequência do Blueprint, seção 2 — este documento não a repete, só
confirma que nenhuma mudou: `servicoDisponivel` → `requiresConsultation` +
`prontoParaAgendamento` (se aplicável) → `existeTesteMechasValido` (se aplicável) →
`clienteVisivel` → `profissionalAtiva` → `estaDeFeriasOuLicenca` →
`podeExecutarServico`.

## 8. O que explicitamente não pertence ao Appointment

- Elegibilidade de cliente, capacidade de profissional, requisito de serviço,
  aceite de orçamento — consultados, nunca decididos aqui (Coordination Over
  Ownership).
- Comissão da profissional — Financeiro reage ao `appointment.concluido`.
- Baixa de estoque — Estoque reage ao mesmo evento.
- Cor/exibição visual na grade — isso é `Service.category`/cor, lido para renderizar,
  nunca armazenado de novo no Appointment.
- Qualquer regra sobre *quando* uma profissional pode trabalhar — isso é
  `WorkingHours`/`ScheduleBlock`, propriedade do domínio Profissional; o Appointment
  só verifica contra o que já existe lá.

---

Aguardando aprovação desta modelagem antes de iniciar a implementação.
