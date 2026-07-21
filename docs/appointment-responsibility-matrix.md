# Appointment Responsibility Matrix
Studio OS · antes da modelagem do domínio Appointment

---

## Matriz completa

| Informação | Proprietário | Como o Appointment a possui | Nunca faz |
|---|---|---|---|
| Identidade do cliente | **Cliente** | Referência (`customerId`) | Não duplica nome/telefone/histórico |
| Elegibilidade do cliente (teste de mechas, visível) | **Cliente** | Consulta `existeTesteMechasValido`/`clienteVisivel` no momento da criação — não armazena o resultado | Não guarda um campo `testeMechasOk: boolean` |
| Identidade da profissional | **Profissional** | Referência (`professionalId`) | Não duplica nome/cor/comissão base |
| Capacidade da profissional | **Profissional** | Consulta `podeExecutarServico` no momento da criação | Não guarda um campo `profissionalHabilitada: boolean` |
| Disponibilidade declarada (`WorkingHours`/`ScheduleBlock`) | **Profissional** | Lê para montar a grade; nunca escreve | Não decide "ela pode trabalhar terça de manhã" — só lê o que já foi declarado |
| Identidade e requisitos do serviço | **Serviço** | Referência (`serviceId`) | Não duplica `requiresCredential`/`recommendedSpecialties` |
| Estratégia de preço do serviço | **Serviço** | Consultada só se não houver Quote (serviço FIXED) | Nunca recalcula `PriceStrategy` |
| Aceite e itens do orçamento | **Quote** | Referência (`orcamentoId`, quando existir) | Não duplica `items`; lê `prontoParaAgendamento` uma vez, na criação |
| **Horário do atendimento** (`startAt`/`endAt`) | **Agenda** | Dado próprio | — é a informação central que só a Agenda produz |
| **Status do agendamento** | **Agenda** | Dado próprio, decisão humana explícita | Nunca inferido de outro domínio |
| **Ausência de conflito de horário** | **Agenda** | Calculado contra outros `Appointment`, dado só dela | A única regra de negócio genuinamente própria (confirmado no Blueprint) |
| **Origem** (ADMIN/PORTAL/WHATSAPP/AI) | **Agenda** | Dado próprio | — |
| **Nota do atendimento** | **Agenda** | Dado próprio, texto livre do momento do agendamento | Nunca controla comportamento (Explicit Domain Rules) |
| **Duração efetiva agendada** | **Agenda, derivada na criação** | Copiada de `Service.durationMinutes`/`ProfessionalService.durationOverride`/`duracaoEstimada(orçamento)` no instante da criação | Snapshot Principle: uma vez agendada, a duração do Appointment não muda se o catálogo mudar depois — é retrato, não referência viva |
| **Valor cobrado neste atendimento** | **Agenda, derivada na criação (Snapshot Principle)** | Copiado de `Quote.valorTotal` ou `Service.price` no instante da criação | Nunca recalculado; um reajuste de preço no catálogo não altera atendimentos já marcados |
| Consumo de produto do serviço (`ServiceProduct`) | **Estoque** | Fora do domínio Appointment — reage ao evento `appointment.concluido`, não é lido na criação | — |
| Comissão da profissional neste atendimento | **Financeiro** | Fora do domínio Appointment — calculada a partir do evento, não armazenada aqui | — |

## Confirmação do Single Owner Principle

Cada linha tem exatamente um dono. As duas linhas marcadas "Agenda, derivada na
criação" são as únicas onde o Appointment guarda um valor que **não é a fonte
primária** — e em ambos os casos isso é um Snapshot Principle explícito (cap. 34),
não uma segunda fonte de verdade escondida: duração e valor são retratos do momento
do agendamento, nunca recalculados depois, e nenhuma lógica os usa para decidir
comportamento fora do próprio Appointment.

## Aplicação de Cross-Domain Insights (cap. 36) aos Decision Cards do Blueprint

| Decision Card (Blueprint, seção 7) | Classificação |
|---|---|
| "3 horários vagos hoje, R$X de receita estimada" | **Cross-Domain** (Agenda + Serviço) |
| "2 confirmações pendentes para hoje" | **Local** (só Agenda) |
| "Credencial da Bia vence em 5 dias, 3 agendamentos dependem dela" | **Cross-Domain** (Profissional + Agenda) |
| "12 clientes costumam retornar neste período" (`clienteInativo`) | **Predictive** (heurística hoje, IA amanhã) |

---

Confirmado: nenhuma informação de Cliente, Profissional, Serviço ou Quote migra
para a Agenda. Pronto para iniciar a modelagem do domínio Appointment.
