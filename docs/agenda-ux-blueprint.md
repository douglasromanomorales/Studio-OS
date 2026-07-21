# Agenda UX Blueprint
Studio OS · antes do primeiro componente React da Agenda visual

> A Agenda é consumidora de `criarAppointment`/`cancelarAppointment`/`remarcar`
> (cancelar + criar, correlacionados) — nunca implementa regra de domínio. Este
> documento é só sobre *experiência*: como a gestora vê, arrasta, clica e navega.

---

## 1. Modos de visualização

- **Dia (padrão)** — colunas por profissional, linhas por horário. É onde 80% do
  uso diário acontece (já identificado na descoberta operacional original).
- **Semana** — uma profissional por vez, dias como colunas. Uso secundário
  (planejamento da semana, não operação do dia).
- **Mês — deliberadamente fora do escopo.** Densidade de informação baixa demais
  para operação real de agenda; nenhum salão real navega o mês para agendar um
  horário. Se um caso de uso real pedir visão mensal (ex: relatório de ocupação),
  isso é Dashboard/Relatórios, não um modo da Agenda.

## 2. Gestos

| Gesto | Ação |
|---|---|
| Clique em slot vazio | Abre `QuickCreate` de novo agendamento |
| Clique em um Appointment | Abre `Sheet` de detalhe |
| Arrastar um Appointment | Move (gera `remarcar` ao soltar) |
| Arrastar a borda inferior | Redimensiona duração (mesmo fluxo de `remarcar` —
  duração nova é só um novo `endAt`, tratado como outro tipo de reagendamento) |
| Botão direito / long-press | `Dropdown` de ações rápidas (confirmar, cancelar, remarcar) |
| Arrastar sobre múltiplos slots vazios | Pré-seleciona duração ao abrir `QuickCreate` |

**Toda ação de arrastar é feedback otimista** (Design Language, cap. 17.5) —
move visualmente antes da confirmação do servidor, com rollback silencioso se
`remarcar` falhar (ex: colisão detectada no servidor por uma condição de corrida).

## 3. Overlays — todos reaproveitados, nenhum novo

| Necessidade | Overlay reaproveitado |
|---|---|
| Criar agendamento | `QuickCreate` (Combobox de cliente com ação de criar rápido, Combobox de serviço) |
| Ver/editar um agendamento | `Sheet` (lado direito, mesma casca do resto do produto) |
| Confirmar cancelamento | `ConfirmationDialog` (`destructive`) |
| Ações rápidas em um card | `Dropdown` |
| Criar agendamento por comando | `CommandPalette` — item "Novo agendamento" abre o mesmo `QuickCreate` |
| Escolher novo horário ao remarcar | `DatePicker` + `TimePicker` dentro do `Sheet`, não um overlay novo |

Nenhum modal/painel novo nasce para a Agenda — é o teste prático de "nenhum
componente específico deve duplicar o que já existe".

## 4. Estados visuais

- **Slot vazio** — hover mostra affordance de "+" sutil, sem poluir a grade em repouso.
- **Appointment card** — cor de fundo derivada de `CorAgenda` da profissional (VO já
  modelado no domínio Profissional); borda/ícone de status conforme
  `AppointmentStatus` (ex: `CONFIRMED` com indicador sólido, `SCHEDULED` com
  indicador tracejado — nunca duas cores concorrendo por atenção, status é forma,
  profissional é cor).
- **Arraste em andamento** — card semi-transparente seguindo o cursor; slots de
  destino inválidos (colisão) destacados em `--danger-subtle` em tempo real,
  calculado no cliente com `haColisaoDeHorario` contra o estado já carregado (mesma
  função do domínio, chamada no client component antes de confirmar no servidor —
  feedback instantâneo sem esperar round-trip).
- **Carregando** — skeleton de grade (colunas + blocos cinza), nunca tela em branco.
- **Vazio** — `EmptyState` quando a organização não tem profissional com
  `WorkingHours` configurada ainda ("Configure a grade de uma profissional para
  começar a agendar").

## 5. Atalhos de teclado

Reaproveita `useKeyboardShortcut` (já extraído na Onda do Workspace): `⌘K` abre o
Command Palette (já global), `N` cria novo agendamento no slot focado, `Esc` fecha
overlay ativo (Radix já cobre isso nativamente em todos os overlays reaproveitados).

**Navegação por grade — o ponto em aberto do Engine Stress Test:** a grade de
horários×profissionais *parece* estruturalmente com `_calendar-grid` (roving
tabindex, uma célula focável por vez, setas movem foco), mas a semântica das teclas
é diferente — setas aqui devem mover entre *horário* (vertical) e *profissional*
(horizontal), não entre *dias*. Duas alternativas, decisão adiada para a
implementação, quando o comportamento real puder ser comparado lado a lado:
1. Generalizar `interpretCalendarKey`/`applyCalendarMove` para aceitar uma grade
   2D genérica (dia×semana vira caso particular de linha×coluna).
2. Construir uma pequena engine própria de navegação de grade tempo×profissional,
   e revisitar depois se as duas deveriam convergir.
Esta é exatamente a decisão que o Engine Stress Test (cap. 40) existe para
informar — não adivinho a resposta aqui, decido com o código das duas grades lado a
lado.

## 6. Fluxos completos

**Criar:** clique em slot vazio → `QuickCreate` → Combobox cliente (busca ou
`QuickCreate` aninhado de cliente novo, mesmo padrão de Consultas) → Combobox
serviço → se `requiresConsultation`, Combobox de Quote aceito da consulta (bloqueia
submit se não houver) → `criarAppointment` → `toast.success` + card aparece
otimisticamente.

**Ver/editar:** clique no card → `Sheet` com dados (via referência aos domínios
donos, nunca duplicado) → ações: Confirmar, Cancelar (`ConfirmationDialog`),
Remarcar (abre seletor de data/hora dentro do próprio Sheet).

**Remarcar:** dentro do Sheet ou por arraste → `cancelarAppointment(reason:
RESCHEDULED)` + `criarAppointment` com o mesmo `correlationId` → UI trata como uma
operação atômica única para o usuário, mesmo sendo duas chamadas de domínio
(exatamente como a modelagem definiu).

## 7. Responsive behavior

Desktop-first (grid denso), mas **Mobile Capable** (Design Language, cap. 6.1):
abaixo do breakpoint, a grade vira **lista** (um card por Appointment, ordenado por
horário) — sem drag-and-drop (interação de desktop, não boa em touch), com as ações
de confirmar/cancelar/remarcar disponíveis diretamente nos cards ou no `Sheet`. Isso
cobre exatamente as operações que a regra Mobile Capable exige: confirmar
agendamento, cancelar atendimento, consultar agenda — sem prometer produtividade
máxima de edição em grade no celular.

---

Aguardando aprovação deste Blueprint antes de iniciar a implementação visual.
