# Platform Evolution Report
CodeChain Design System · consolidado desde a Onda 1 até a Agenda

---

## 1. Promoções (Preview → Stable)

| Componente/Engine | Motivo da promoção |
|---|---|
| `QuickCreate` | Primeiro a completar o ciclo completo do Domain Pipeline (Onda 3.5) |
| `Breadcrumb` | Terceiro uso real sem adaptação (Consultas, Operating Center, Clientes) |
| `TopbarSlot` | Nasceu de um achado real (Consultas) e já serviu 2 módulos imediatamente |
| `ShellRoot`/`ShellSidebar`/`ShellTopbar`/`ShellContent`/`SidebarNav` | Workspace promovido com 2 módulos reais (Consultas + Operating Center) |
| `Workspace` (como um todo) | Critério oficial cumprido: 2 módulos reais, Release Gate aprovado |
| `Pagination` | Funcionou sem modificação na primeira integração real (Clientes) |
| `_combobox-shell`, `_popover-shell`, `_panel-shell` | Cada uma com 3+ consumidores reais |
| `Upload Engine`, `Mask Engine` | Validadas no módulo Consultas |
| `_calendar-engine`/`_calendar-grid` | Remediada (roving tabindex real) e reclassificada com evidência precisa após o Engine Stress Test com a Agenda |
| `DatePicker`/`DateRangePicker` | Dependiam da Calendar Engine — promovidos junto após a remediação |

## 2. Reversões

| Item | O que aconteceu |
|---|---|
| `_use-debounced-callback` | Promovido a público por engano (achei que Clientes o consumia); Clientes na verdade usa `setTimeout` inline. **Revertido para interno** ao perceber que só existe 1 consumidor real, não 2. Primeira autocorreção desta série, não motivada por auditoria externa. |
| `DatePicker`/`DateRangePicker` | Regrediram de "quase Stable" para **Preview** quando o Platform Hardening encontrou o gap de teclado do `_calendar-engine` — aplicação direta da regra "Stable nunca depende de Preview". Promovidos de volta após a remediação. |

## 3. Componentes locais — nunca promovidos, corretamente

| Componente | Por que ficou local |
|---|---|
| `grid-navigation.ts` (Agenda) | Engine Stress Test concluiu que a semântica não generaliza com `_calendar-engine` — ver relatório dedicado |
| `AgendaGrid`, `AppointmentCard`, `AgendaMobileList`, `NovoAppointmentQuickCreate`, `AppointmentSheet` | Específicos do módulo Agenda, sem sinal de reuso transversal (Platform Discovery, passo 2) |
| `ConsultaStatusBadge` | Pattern de domínio — conhece o enum `ConsultaStatus`, que `@codechain/ui` nunca deveria conhecer |
| `dashboard-data.ts` | Camada de dado do Operating Center, específica do Studio OS |

## 4. Componentes/engines promovidos a partir de achados reais (nasceram já públicos)

| Item | Origem |
|---|---|
| `DecisionCard`/`DecisionBlock` | Nasceram em `@codechain/ui/patterns` no momento em que o Operating Center precisou deles — nunca existiram como componente local primeiro |
| `Toast` | Achado tardio (estava na lista desde a Onda 1, nunca construído) — a Feedback Layer do Workspace não fechava sem ele |
| `_use-keyboard-shortcut` | Extraído da duplicação real entre `CommandPalette` e o toggle de Sidebar (⌘B) |
| `_floating-surface-style` | Extraído da duplicação real entre `Popover` e `Dropdown` (primitivas Radix diferentes, mesma aparência) |
| `_popover-shell`, `_panel-shell` | Onda 3.5 — extraídos de duplicação real entre Combobox/Popover e Sheet/Drawer/SidePanel/QuickCreate |
| `use-media-query` | Extraído nesta rodada — a Agenda precisava da mesma detecção de mobile que o Shell já computava internamente; promovido em vez de duplicar ou vazar acesso a `_shell-context` |
| `Sheet`, `Drawer`, `SidePanel`, `Dialog`, `ConfirmationDialog`, `CommandDialog`, `Dropdown` | Onda 3.5 — resolveram a lacuna que o relatório de validação de Consultas encontrou |
| Render props do `Combobox` | Evoluído de props fixas para `renderItem`/`renderEmpty`/`renderLoading`/`renderHeader`/`renderFooter` — mais flexível sem crescer a API obrigatória |

## 5. Princípios criados (ordem de aparição)

`Headless First` · `Classificação de Maturidade (Experimental/Preview/Stable/Deprecated)` ·
`Regra de dependência entre níveis de maturidade` · `Foundation Gate → Release Gate` ·
`Dependency Risk Matrix` · `Domain Readiness` · `Temporal Truth` ·
`Domain Validation Report + Architecture Decision Log` · `Capability over Attribute →
Capability Provenance` · `SaaS First / Multi-tenancy Explícita` · `Catalog Over Logic` ·
`Derived Over Stored` · `Explicit Domain Rules` · `Workflow Before UI` · `Domain
Pipeline` · `Snapshot Principle` · `Single Owner Principle` · `Cross-Domain Insights` ·
`Coordination Over Ownership` · `Appointment Identity Principle` · `Snapshot
Eligibility` · `Engine Stress Test` · `Platform Discovery` · `Interaction Readiness`.

24 princípios, cada um nascido de uma decisão real durante a implementação — nenhum
foi escrito antecipadamente "porque parecia uma boa prática geral".

## 6. Abstrações descartadas ou adiadas — decisão consciente, não esquecimento

| Abstração | Status |
|---|---|
| `InlineCreate`, `Wizard`, `ActionPanel` | Adiados — sem consumidor real ainda (Onda 3.5) |
| Generalização de `_calendar-engine` para grid 2D genérico | Rejeitada — Engine Stress Report, semântica de tecla incompatível |
| `AppointmentService` (tabela) | Removida do schema — duplicava Single Owner de Quote/Serviço |
| `EXPIRADO` como estado persistido do Orçamento | Nunca chegou a existir em produção — virou Specification (`orcamentoExpirado`) antes da implementação |
| Contador `sessõesUsadas` mutável | Nunca implementado — decidido como derivado (`sessionsRemaining`) antes de o Pacote nascer |
| `requiresConsultation` como campo próprio do Serviço | Nunca existiu como coluna — derivado de `priceStrategy.mode` desde a modelagem |
| Filter Builder | Ainda adiado — nenhum módulo real definiu a forma de filtro necessária |

## 7. O que isso demonstra, em conjunto

Das correções/decisões estruturais registradas nas seções 1-6, **a maioria
aconteceu antes do código errado existir** (Serviço, Quote, Appointment) — só os
domínios mais antigos (Cliente, Profissional, componentes da Onda 1) precisaram de
correção retroativa. Essa é a evidência mais concreta de que os princípios do
manifesto pararam de ser reação a bug e passaram a ser parte do processo de decisão
em si — o objetivo declarado desde o primeiro capítulo.

---

## Veredito: Agenda → Stable

Com o Engine Stress Report e este Platform Evolution Report concluídos, e a
Interaction Readiness da Agenda fechada (teclado real, drag, resize, animações,
acessibilidade completa — `aria-label` descritivo + `aria-live`, responsividade
mobile via `AgendaMobileList`, atalhos), os três artefatos exigidos estão prontos.

**Agenda: Preview → Stable.**

Próximo domínio: Financeiro.
