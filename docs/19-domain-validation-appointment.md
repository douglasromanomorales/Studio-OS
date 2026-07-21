# Domain Validation Report — Appointment
O domínio que fecha o núcleo transacional do Studio OS

---

## 1. Fidelidade ao modelo

Mantido integralmente, e com uma correção estrutural real feita **antes** da
implementação errada existir (não depois, como nos domínios anteriores):
`AppointmentService` — tabela já presente no schema desde a arquitetura original —
duplicava exatamente o que `Quote`/`OrcamentoItem` agora possuem (lista de serviços
+ preço por item). Isso só ficou visível quando a Appointment Identity Principle
nomeou `serviceId`/`quoteId` como campos singulares. **Removida** — `Appointment`
agora referencia exatamente um `serviceId` (caminho FIXED direto) ou um `quoteId`
(caminho via orçamento aceito), nunca os dois, nunca uma lista própria.

`appointment.reagendado` confirmado como não-evento — reagendar é
`AppointmentCancelled(reason: RESCHEDULED)` + `AppointmentScheduled` novo,
correlacionados por `correlationId`, exatamente como decidido antes da
implementação começar.

## 2. Componentes de plataforma exercitados

Nenhum novo — este domínio, no estágio atual (Application Service +
Specifications), ainda não tem UI própria. A Agenda visual (grade, `_calendar-grid`,
drag-and-drop) é o próximo passo, fora do escopo desta rodada de implementação de
domínio.

## 3. Coordination Over Ownership — auditoria da implementação

`criarAppointment` chama, na ordem exata do Blueprint: `servicoDisponivel`,
`requiresConsultation`+`resolvePriceStrategy` (Serviço) · `prontoParaAgendamento`
(Quote) · `existeTesteMechasValido`-equivalente via dado do Cliente (mock ainda,
formato já correto) · `profissionalAtiva`, `estaDeFeriasOuLicenca`,
`podeExecutarServico` (Profissional) · e só then `haColisaoDeHorario` — a única
Specification que pertence ao próprio Appointment. Nenhuma regra de outro domínio
foi reimplementada dentro do Application Service — cada checagem é uma chamada de
função importada, não um `if` reinventando a lógica.

## 4. Snapshot Eligibility aplicado

`durationMinutesSnapshot`/`priceCentsSnapshot` passam no teste das três perguntas
(cap. 39): representam o combinado no instante do agendamento, mudança futura no
catálogo não deveria alterá-los. Nome de cliente/profissional/serviço
deliberadamente **não** são snapshot — seguem como referência viva, consistente com
a distinção já registrada na modelagem.

## 5. Temporal Truth / Derived Over Stored

`IN_PROGRESS` confirmado fora do enum — `atendimentoEmAndamento` é Specification
pura, testada (3 casos). Nenhum boolean temporal introduzido.

## 6. SaaS Readiness

`organizationId` primeiro parâmetro em `criarAppointment`/`cancelarAppointment`,
quinto domínio seguido sem repetir o achado original de Cliente.

## 7. Lições aprendidas

1. **A correção de `AppointmentService` é a primeira que aconteceu por causa de um
   princípio (Identity Principle) forçando uma pergunta nova sobre um schema já
   existente**, não por auditoria retroativa de código com bug. Isso é a evidência
   mais forte até agora de que os princípios do manifesto não são só
   documentação — eles mudam decisão de schema no momento em que são declarados.
2. **`haColisaoDeHorario` sendo a única regra própria, depois de cinco domínios de
   preparação, foi visceralmente mais simples de escrever do que qualquer
   Specification anterior.** É o sinal mais concreto de que Domain Readiness +
   Coordination Over Ownership funcionaram: quando chegou a hora de escrever a
   Agenda de verdade, quase não havia mais nada difícil sobrando para ela decidir.
3. **O Application Service de criação ficou grande em número de checagens (9
   passos), mas pequeno em complexidade real** — cada passo é uma chamada de
   função de 1 linha. O tamanho vem de orquestrar, não de decidir; é exatamente a
   assinatura de um orquestrador saudável, não um sinal de que a função "faz demais".

---

## Interaction Matrix — reexecução

Com Appointment implementado, o núcleo transacional completo (Cliente →
Profissional → Serviço → Quote → Appointment) está de pé. Nenhuma dependência
ausente para os próximos módulos do roadmap (Financeiro, Estoque) — ambos só
reagem a `appointment.concluido`, evento já emitido.

## Promotion Review

Nenhum componente de plataforma envolvido nesta rodada (implementação de domínio
puro, sem UI). Fica para a próxima rodada, quando a grade visual da Agenda
consumir `_calendar-engine`/`_calendar-grid` pela primeira vez em um contexto
diferente de `DatePicker`/`DateRangePicker` — o teste real de que a engine serve
múltiplas camadas da hierarquia, como o capítulo 19 do Design Language previu desde
a Onda 3c.

---

## Domain Pipeline — status

```
Modelagem ✅ → Aprovação ✅ → Implementação ✅ (domínio) → Domain Validation Report ✅ (este documento)
    → Interaction Matrix ✅ (reexecutada acima) → Promotion Review ✅ (nada a promover)
    → Liberado para consumo ✅
```

O domínio Appointment está liberado. A **Agenda como interface visual** — a grade,
o drag-and-drop, a view diária/semanal — é o próximo passo, e consome este domínio
exatamente como qualquer outro consumidor: chamando `criarAppointment`, nunca
reimplementando as 9 checagens.
