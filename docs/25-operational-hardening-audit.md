# Operational Hardening Audit
Studio OS · auditoria completa antes de qualquer nova implementação

> Regra seguida à risca: todo achado abaixo foi confirmado lendo o código real
> (`grep`/`view`), não por suposição. Onde não consegui confirmar (ex: performance
> real, execução de teste), digo isso explicitamente em vez de estimar como fato.

---

## 1. Cross Domain Audit

| Domínio | Achado | Severidade |
|---|---|---|
| Cliente | `consentAt`/`consentVersion` continuam como 2 campos mutáveis, não `ConsentRecord` — encontrado no Domain Validation Report #1, **proposto, nunca implementado** (corretamente, por instrução explícita naquele momento) | **Alta — risco de LGPD, ver seção 3** |
| Cliente | `clienteInativo`/`clienteEmRisco` continuam sem nenhum consumidor real de UI — Specifications mortas desde o relatório #1 | Baixa |
| Cliente | **Confirmado por leitura de código:** `listarClientes` nunca filtra por `clienteVisivel` — só um comentário `// TODO`. Clientes arquivados apareceriam na lista/busca normalmente | **Média** |
| Profissional | Nenhuma reação automática ao evento `profissional.desligada` — Appointments futuros dela continuam `SCHEDULED` sem sinalização | **Média** |
| Serviço | Alteração de preço protegida corretamente por `priceCentsSnapshot`/`OrcamentoItem` snapshots — confirmado, sem gap | — |
| Quote/Financeiro | **Achado novo desta auditoria:** `commissionRateSnapshot` é capturado no momento do **pagamento** (`CommissionPayout`), não no momento do **atendimento**. Se a taxa de comissão da profissional mudar entre o atendimento e o pagamento, a apuração usa a taxa *atual*, aplicando-a retroativamente a atendimentos feitos sob a taxa antiga | **Alta** |
| Financeiro | **Achado novo, confirmado por leitura de código:** `totalRecebidoDoAppointment` (Sprint 1) soma todo `INCOME` sem excluir reversões; `apurarComissoesDoPeriodo` (Sprint 2) exclui reversões corretamente. **Duas funções, duas respostas diferentes para "quanto foi recebido"** | **Alta** |
| Financeiro | **Confirmado:** `registrarEstorno` nunca propaga `appointmentId` no evento emitido — mesmo corrigindo o bug acima, o estorno hoje não se vincula ao atendimento original | **Alta** (agrava o achado anterior) |

## 2. Operational Stress Review

| Cenário | Comportamento atual | Risco |
|---|---|---|
| Cancelamento | `AppointmentCancelled` + correlationId — correto | Nenhum |
| Inadimplência | `estaInadimplente` existe mas **não é usada** por `listarPendencias`, que usa um critério mais simples (`saldoDevedor > 0`, sem checar prazo vencido) — dois critérios de "problema" coexistindo sem unificação | Médio |
| Estorno | Funciona, mas ver achados da seção 1 (appointmentId, dupla lógica de soma) | Alto |
| Desconto | Absorvido automaticamente pela derivação — confirmado correto | Nenhum |
| Profissional desligada | Evento emitido, nada reage — agendamentos futuros dela ficam órfãos silenciosamente | Médio |
| Serviço descontinuado | Protegido por snapshot — correto | Nenhum |
| Alteração de preço | Protegido por snapshot — correto | Nenhum |
| Alteração de comissão | **Bug confirmado** (seção 1) — retroatividade indevida | Alto |
| Reagendamento | correlationId — correto | Nenhum |
| Pagamentos parciais / múltiplos recebimentos | Suportado estruturalmente (N `Transaction` por Appointment), mas herda os bugs de soma da seção 1 | Alto |
| Cliente arquivado | Gate existe na criação de Appointment; **não existe** em listagem/busca de Clientes (achado confirmado, seção 1) | Médio |
| Credencial vencida | Checada na criação de Appointment (correto); **nenhum alerta proativo** existe — o Decision Card "credencial vence em 5 dias" era exemplo ilustrativo na Responsibility Matrix, nunca implementado | Baixo (era aspiracional, não regressão) |

## 3. SaaS Readiness Audit

| Item | Status | Nota |
|---|---|---|
| Multi-tenant | ✅ | `organizationId` primeiro parâmetro, disciplina mantida em 100% dos Application Services desde o domínio Cliente |
| **LGPD** | ⚠️ **Bloqueador** | Consentimento mutável (achado 1) é um risco de compliance real, não teórico — não há como provar historicamente quando um consentimento foi dado/revogado |
| **Auditoria** | ⚠️ **Bloqueador** | **Confirmado: não existe tabela `AuditLog` no schema.** Só existe o padrão `emitirEvento()` → `console.log`. Nenhum evento é persistido em lugar nenhum |
| **Logs/Observabilidade** | ⚠️ **Bloqueador** | Mesma raiz do item acima — `console.log` não é log estruturado nem persistido |
| Escalabilidade | ⚠️ Parcial | Paginação existe em Clientes; virtualização de lista (recomendada desde o Platform Hardening original) segue não implementada |
| Integridade | ⚠️ Comprometida pelos achados da seção 1 | — |
| Performance | Não medida em ambiente real (mesma ressalva de todo relatório desde o Platform Hardening) | — |
| **Segurança** | ⚠️ **Bloqueador crítico** | **Confirmado: nenhum Application Service verifica sessão, usuário ou `Membership.role`.** `organizationId` é um parâmetro confiável por convenção, não validado contra nenhuma sessão autenticada — hoje, estruturalmente, qualquer chamador pode operar sobre qualquer organização |
| Backup/Deploy | Fora de escopo até a fase de infraestrutura (Version 1.0 Hardening mais ampla) | Correto não abordar ainda |

## 4. DDD Consistency Audit

- **Aggregates:** nenhum incorreto encontrado. Financeiro como três aggregate roots
  (`Transaction`, `CommissionPayout`, `CashClosing`) está certo — três fatos de
  naturezas diferentes, não deveriam ser um só.
- **Entity que deveria ser VO:** nenhuma crítica. `TransactionCategory` como Entity
  está correto (tem ciclo de vida próprio, é renomeável).
- **VO que deveria ser Entity:** nenhum encontrado.
- **Inconsistência real encontrada:** `Service.recommendedSpecialties` é
  `String[]` simples; `Customer` usa uma Entity relacional inteira
  (`CustomerTag`) para o mesmo tipo de conceito (uma lista de rótulos). Mesma
  forma conceitual, duas modelagens diferentes em dois domínios — não é um erro
  grave, mas é uma inconsistência de convenção que vale unificar.
- **Specification duplicada:** confirmada — `totalRecebidoDoAppointment` e a
  lógica de exclusão de reversão dentro de `apurarComissoesDoPeriodo` resolvem o
  mesmo problema ("quanto foi líquido recebido") de duas formas diferentes,
  incorretamente divergentes. Mesma raiz dos achados da seção 1.
- **Evento redundante — questão em aberto, não bug:** `remarcarAppointment` emite
  `appointment.cancelado`, `appointment.criado` **e** `appointment.remarcado_via_correlacao`.
  O terceiro evento é redundante *se* todo consumidor souber inferir reagendamento
  a partir do `correlationId` nos dois primeiros — mas é conveniente para quem não
  quiser fazer essa inferência. Não é claramente errado; é uma decisão de design
  que vale revisitar com um consumidor real (Notificações, quando existir).

## 5. Platform Audit

**Nunca usados em nenhum módulo do Studio OS até aqui:** `Checkbox`/`CheckboxField`,
`RadioGroup`, `Rating`, `OtpInput`, `FileUpload` (como componente próprio — só
`ImageUpload` foi usado), `Popover` (só usado internamente via `_popover-shell`,
nunca como componente público direto), `Drawer`, `SidePanel`, `CommandDialog`
(direto — só via `CommandPalette`), `NumberInput`, `Stepper`, `Slider`.

**Deveriam ser promovidos:** nenhum ainda. `Select` e `Tabs` tiveram primeiro uso
real recente (Financeiro Sprint 1 e 2), mas cada um com **um** módulo só — abaixo
da barra que os outros componentes Stable desta plataforma cumpriram.

**Deveriam voltar para Preview:** nenhum — nenhuma regressão encontrada em
componente já Stable durante esta auditoria.

**Podem ser removidos:** nenhum recomendado. Não-uso não é sinal de erro — vários
desses primitivos (Checkbox, NumberInput) são blocos básicos que os próximos
domínios (Estoque, Portal) provavelmente vão precisar. Remover agora seria otimizar
para um sintoma (baixo uso até aqui) que não indica um problema real.

**Promovidos cedo demais — achado de governança, não de qualidade:**
`Pagination` foi promovida a Stable com **um** módulo real consumindo
(Clientes). O critério explícito de "2 módulos reais" foi formalizado
especificamente para o `Workspace`; os demais componentes usaram um critério mais
brando ("funcionou sem adaptação na primeira integração real"). Isso não é
necessariamente errado, mas **o manifesto nunca declarou qual critério vale para
componentes comuns vs. para o Workspace** — é uma ambiguidade de governança que
vale fechar, não uma promoção que precise ser revertida.

## 6. Global Interaction Matrix

| Domínio | Cliente | Profissional | Serviço | Quote | Appointment | Financeiro |
|---|---|---|---|---|---|---|
| **Cliente** | — | ❌ | ❌ | ❌ | ❌ | ❌ (Policy VIP automática ainda não lê Financeiro, apesar do domínio já existir — Domain Readiness gate aberto, não explorado) |
| **Profissional** | ❌ | — | ❌ | ❌ | ❌ | ❌ |
| **Serviço** | ❌ | ❌ | — | ❌ | ❌ | ❌ |
| **Quote** | ✅ (via Consulta) | ✅ | ✅ (via OrcamentoItem) | — | ❌ | ❌ |
| **Appointment** | ✅ | ✅ | ✅ | ✅ | — | ❌ |
| **Financeiro** | ❌ | ✅ (taxa de comissão) | ❌ | ❌ | ✅ (`priceCentsSnapshot`, via Transaction) | — |
| **Agenda** (orquestrador) | ✅ | ✅ | ✅ | ✅ | — | ❌ |
| **Operating Center** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |

Nenhum ciclo de dependência circular encontrado. Fronteiras confirmadas íntegras —
os bugs encontrados (seção 1) são de **lógica interna ao Financeiro**, não de
acoplamento indevido entre domínios.

## 7. Technical Debt Register

### Dívida bloqueadora (impede operação real de produção)
1. **Ausência total de autenticação/autorização** — nenhum Application Service
   valida sessão ou `Membership.role`.
2. **Ausência de `AuditLog` persistido** — só `console.log`.
3. **Consentimento LGPD mutável** — `consentAt`/`consentVersion` sem histórico.
4. **Bug de soma de recebimentos líquidos** — `totalRecebidoDoAppointment` não
   exclui reversões; propaga para `saldoDevedor`/`estaInadimplente`.
5. **`registrarEstorno` não propaga `appointmentId`.**
6. **`commissionRateSnapshot` capturado tarde demais** — retroatividade indevida
   de mudança de taxa.
7. **Nenhuma conexão real de banco de dados** — todo `tenantDb(...)` é um `TODO`;
   toda a implementação até aqui roda sobre dado mockado em memória.

### Dívida planejada (já conhecida, com data)
- Financeiro Sprint 3 (Pix, Gateway, NF-e, conciliação).
- `CustomerPackage`/`PackageUsage`/`sessionsRemaining` (Bundles/Pacotes, ainda não
  implementado — só reservado na modelagem de Serviços).
- Estoque, Portal do Cliente, IA/Analytics, White Label (roadmap de fases).
- Virtualização de listas grandes (Platform Hardening original).

### Dívida aceita (decisão consciente, sem plano de resolver agora)
- `InlineCreate`, `Wizard`, `ActionPanel` — sem consumidor real.
- Multi-moeda — fora do mercado-alvo atual.
- Generalização de `_calendar-engine` — rejeitada pelo Engine Stress Test.

### Dívida descartada (avaliada e recusada deliberadamente)
- Tabela `Commission` — eliminada por Derived Over Stored antes de existir.
- Tabela `AppointmentService` — removida por violar Single Owner.
- Evento `appointment.reagendado` — substituído por Cancelled+Scheduled+correlationId.

## 8. Version 1.0 Readiness Report

**A pergunta mais honesta primeiro:** hoje, a implementação inteira — todos os 6
domínios, todos os 2 sprints de Financeiro — roda sobre **dado mockado em
memória**. Nenhum `tenantDb(...)` foi trocado por uma chamada real de Prisma em
nenhum momento desta série. Isso não é uma falha do processo — foi o escopo
deliberado de cada rodada (modelar e provar a forma certa antes de conectar
infraestrutura) — mas significa que a resposta a "aguenta 6 meses de operação
real?" não é sobre a qualidade do domínio. É sobre o que ainda não existe.

**Riscos, em ordem de severidade:**
1. Não existe banco de dados real conectado — bloqueador absoluto, antes de
   qualquer outra coisa.
2. Não existe autenticação/autorização — segundo bloqueador absoluto; conectar o
   banco sem isso seria pior que não conectar.
3. Os 3 bugs financeiros confirmados nesta auditoria (soma de recebidos, estorno
   sem vínculo, taxa de comissão tardia) precisam de correção antes do primeiro
   fechamento de caixa real — dinheiro é a área com menor tolerância a erro de
   todo o sistema.
4. LGPD (consentimento mutável) precisa de correção antes de qualquer dado real
   de cliente entrar no sistema.

**O que pode esperar, com segurança:**
- Estoque — a Casa Nataly consegue operar sem ele por meses, controlando estoque
  fora do sistema, como já faz hoje.
- Portal do Cliente — melhora experiência, não bloqueia operação interna.
- IA/Analytics — nenhuma dependência de operação real.
- Financeiro Sprint 3 (integrações) — recebimento manual (como já implementado)
  cobre a operação real da Casa Nataly hoje.

**Módulos que ainda faltam para o núcleo mínimo funcionar de verdade:**
nenhum módulo de domínio — os 6 já cobrem o ciclo completo
Consulta→Quote→Appointment→Financeiro. O que falta é **infraestrutura**: banco
real, autenticação, observabilidade mínima (mesmo que só error tracking).

**Veredito objetivo:** o *modelo* de negócio está pronto para 6 meses de operação
real. A *implementação conectada* não está — e não deveria ser avaliada como se
estivesse, porque nunca foi esse o objetivo desta fase.

---

## Atualização do ADL

### ADL-103 — Operational Hardening Audit encontrou 3 bugs financeiros reais
**Contexto:** primeira auditoria cross-domain completa da plataforma.
**Decisão:** achados registrados no Technical Debt Register como dívida
bloqueadora; nenhuma correção implementada nesta rodada, por instrução explícita.
**Consequência:** próxima implementação financeira (seja Sprint 3 ou correção
dedicada) precisa resolver os 3 bugs antes de qualquer novo recurso.

### ADL-104 — Ausência de auth/AuditLog/banco real formalmente reconhecida como bloqueadora de V1.0
**Contexto:** toda a implementação de domínio (Fase 1 + Financeiro) rodou sobre
dado mockado, sem sessão/autorização real.
**Decisão:** essas três ausências são bloqueadoras absolutas para operação real,
priorizadas acima de qualquer novo módulo de domínio.
**Consequência:** a fase seguinte à Operational Hardening deveria ser
infraestrutura (banco real + auth), não mais um domínio novo — mesmo que o
roadmap de fases sugerisse Financeiro Sprint 3 ou Estoque em seguida.

---

Aguardando aprovação antes de qualquer nova implementação.
