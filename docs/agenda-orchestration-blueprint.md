# Agenda Orchestration Blueprint
Studio OS · a conversa entre domínios, não um domínio novo

> A Agenda não cria regra de negócio. Toda decisão abaixo tem um dono — um domínio
> já implementado e liberado pelo Domain Pipeline. A Agenda só pergunta, na ordem
> certa, e reage. Isso é o que separa um orquestrador de um módulo que concentra
> regras espalhadas — a distinção que motivou este documento existir antes de
> qualquer entidade nova.

---

## 1. Specifications consumidas, por domínio

| Domínio | Specification | O que responde |
|---|---|---|
| **Cliente** | `clienteVisivel(cliente)` | Cliente não está arquivado/anonimizado |
| | `existeTesteMechasValido(registros, hoje)` | Gate de segurança para serviço químico |
| **Profissional** | `profissionalAtiva(terminatedAt)` | Profissional não foi desligada |
| | `estaDeFeriasOuLicenca(blocks, hoje)` | Bloqueio de agenda no intervalo |
| | `podeExecutarServico(credenciais, requirements, hoje)` | Capability Provenance — gate duro |
| **Serviço** | `resolvePriceStrategy(pricingMode, price)` | Resolve o VO de preço |
| | `requiresConsultation(strategy)` | Decide se precisa de Quote antes |
| | `servicoDisponivel(discontinuedAt)` | Serviço ainda está no catálogo ativo |
| | `buildRequirements(service)` | Requisitos declarados (credencial/especialidade/teste) |
| **Quote** | `prontoParaAgendamento(orcamento, hoje)` | O único contrato de aceite que a Agenda lê |
| | `orcamentoExpirado(orcamento, hoje)` | Consultado indiretamente, dentro da anterior |
| | `duracaoEstimada(items)` | Duração vinda do orçamento, quando existir um |

A Agenda **nunca reimplementa** nenhuma destas — importa e chama.

---

## 2. Ordem exata das decisões (criação de um Appointment)

```
1. servicoDisponivel(service)                         → Serviço
   se false: recusa, serviço descontinuado

2. requiresConsultation(resolvePriceStrategy(service)) → Serviço
   se true  → 2a. prontoParaAgendamento(orcamento)     → Quote
              se false: recusa, sem orçamento aceito
   se false → segue direto (serviço FIXED, sem Quote)

3. service.requiresStrandTest?                         → Serviço (dado)
   se true  → existeTesteMechasValido(cliente, hoje)   → Cliente
              se false: recusa, teste de mechas pendente

4. clienteVisivel(cliente)                              → Cliente
   se false: recusa, cliente arquivado/anonimizado

5. profissionalAtiva(profissional)                      → Profissional
   se false: recusa, profissional desligada

6. estaDeFeriasOuLicenca(profissional, data)             → Profissional
   se true: recusa, profissional bloqueada nesse período

7. podeExecutarServico(profissional, requirements, hoje) → Profissional
   se false: recusa, credencial ausente/vencida

8. duração efetiva = ProfessionalService.durationOverride
                      ?? duracaoEstimada(orcamento.items)
                      ?? service.durationMinutes          → dado, não regra nova

9. [ÚNICA ETAPA QUE PERTENCE À AGENDA] verificar colisão de horário —
   nenhum outro Appointment do mesmo profissional sobrepõe [startAt, startAt+duração)

10. criar Appointment, status SCHEDULED, emitir appointment.criado
```

A ordem importa: checagens baratas e definitivas primeiro (serviço existe? tem
Quote?), checagens de disponibilidade por último (é a única etapa que exige
consultar outros Appointments — mais cara).

## 3. Responsável por cada decisão

| Decisão | Dono |
|---|---|
| Serviço existe/está ativo, precisa de Quote | Serviço |
| Orçamento foi aceito | Quote |
| Cliente pode fazer química agora | Cliente |
| Cliente está visível (não arquivado) | Cliente |
| Profissional está ativa/disponível no período | Profissional |
| Profissional pode executar este serviço | Profissional |
| Duração efetiva do atendimento | Serviço/Quote (dado), nunca decisão nova |
| **Não existe colisão de horário** | **Agenda — a única regra genuinamente dela** |

## 4. Invariantes que a Agenda respeita

1. Nunca dois Appointments do mesmo profissional se sobrepõem no tempo.
2. Nunca cria Appointment para serviço `QUOTE_REQUIRED` sem `prontoParaAgendamento`.
3. Nunca cria Appointment para serviço com `requiresStrandTest` sem
   `existeTesteMechasValido`.
4. Nunca cria Appointment com profissional sem a credencial exigida.
5. Nunca cria Appointment com cliente arquivado/anonimizado.
6. Duração de um Appointment vem sempre de um domínio consumido — Agenda nunca
   inventa um número.

## 5. Eventos que a Agenda produzirá

`appointment.criado` · `appointment.confirmado` · `appointment.reagendado` ·
`appointment.cancelado` · `appointment.concluido` · `appointment.no_show` — os
últimos quatro são **decisões humanas explícitas** (recepção/profissional
clicando), nunca inferidas — consistente com Temporal Truth: cada uma vira uma
transição registrada com timestamp, não um cálculo.

## 6. Consultas que a Agenda fará (somente leitura, nunca grava nos domínios consumidos)

Para popular a grade: `WorkingHours`/`ScheduleBlock` do Profissional (onde ela
pode, de fato, ter algo marcado) · lista de `Appointment` existentes do período
(dela mesma, não de outro domínio) · `Service.durationMinutes`/`category` para
renderizar a cor/duração do bloco. Para validar uma ação: as Specifications da
seção 1, na ordem da seção 2.

## 7. Decision Cards que podem surgir do orquestrador

- *"Você ainda pode preencher 3 horários vagos hoje..."* — cruza grade vazia
  (Agenda) com `PriceStrategy` dos serviços mais comuns (Serviço) para estimar
  receita — exemplo já usado no Operating Center, agora com a fonte de dado real
  identificada.
- *"2 confirmações pendentes para hoje"* — `Appointment.status === SCHEDULED` +
  `startAt` é hoje (dado só da Agenda).
- **Específico do orquestrador, que nenhum domínio isolado conseguiria produzir
  sozinho:** *"A credencial de Toxina Botulínica da Bia vence em 5 dias — 3
  agendamentos desta semana dependem dela."* Cruza `ProfessionalCredential.validUntil`
  (Profissional) com `Appointment`s futuros que exigem aquele serviço (Agenda) — só
  existe porque a Agenda tem visão dos dois ao mesmo tempo.

## 8. Estados de Appointment

**Persistidos (decisões humanas explícitas — Temporal Truth respeitado):**
```
SCHEDULED → CONFIRMED → DONE
    │            │
    └──► CANCELED ◄──┘
    (CONFIRMED) → NO_SHOW
```

**Removido da lista de estados persistidos, nesta modelagem preventiva:**
`IN_PROGRESS`. Ninguém clica "iniciar atendimento" na realidade operacional
mapeada — é implícito pelo horário. Vira Specification derivada:
`atendimentoEmAndamento(appointment, agora)` = `status === "CONFIRMED" && agora
está entre startAt e endAt`. Mesma aplicação de Derived Over Stored feita em todo
domínio anterior, desta vez prevenindo o erro antes de escrever o enum, não
corrigindo depois.

## 9. O que NÃO pertence à Agenda

- **Nada de Cliente:** elegibilidade, teste de mechas, dado cadastral.
- **Nada de Profissional:** capacidade, credencial, disponibilidade *declarada*
  (a Agenda consome `WorkingHours`, não decide o que está nela).
- **Nada de Serviço:** preço, duração base, requisitos, categoria.
- **Nada de Quote:** aceite, expiração, itens, valor.
- A Agenda também não decide **comissão** (Financeiro), não decide **estoque**
  consumido (Estoque via `ServiceProduct`, mas a baixa em si é do Estoque) — só
  regista que um Appointment aconteceu; outros domínios reagem ao evento.

---

Aguardando aprovação deste Blueprint antes de iniciar a modelagem do domínio
Appointment e da Agenda.
