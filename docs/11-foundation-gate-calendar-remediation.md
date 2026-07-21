# Foundation Gate — Remediação da Calendar Engine
CodeChain Design System · checklist de saída antes de Navigation

---

## 1. O que foi corrigido

| Antes | Depois |
|---|---|
| `_calendar-engine.tsx` misturava aritmética de data com JSX — violava Headless First | Dividido em `_calendar-engine.ts` (puro) + `_calendar-grid.tsx` (UI) |
| Navegação só por `Tab` célula a célula (até 42 tabs) | Roving tabindex — uma única célula tabulável, setas/Home/End/PageUp/PageDown/Shift+PageUp/PageDown movem o foco real |
| Sem anúncio de troca de mês para quem não vê a tela | Região `aria-live="polite"` anuncia mês/ano ao cruzar a fronteira do mês |
| `aria-label` genérico (só o número do dia) | `aria-label` com data completa por extenso ("12 de julho de 2026, domingo") |
| Sem `role="grid"`/`role="gridcell"`/`aria-selected`/`aria-current` | Todos presentes, seguindo o padrão WAI-ARIA APG "Date Picker Dialog" |
| Sem testes | 18 casos novos em `_calendar-engine.test.ts`, cobrindo geração de grade, interseção de intervalo e cada tecla do padrão APG |

**Desvio deliberado do pedido original, explicado no código e aqui:** não combinei
roving tabindex com `aria-activedescendant` — são técnicas alternativas do WAI-ARIA
APG para o mesmo problema, não complementares. Roving tabindex é o padrão correto
para grades (é o que o próprio exemplo de referência "Date Picker Dialog" do
WAI-ARIA APG usa); `aria-activedescendant` é para widgets que mantêm o foco do DOM
num elemento externo (como um combobox). Implementar os dois juntos produziria
comportamento inconsistente entre leitores de tela.

## 2. Reexecução dos critérios (com a mesma ressalva de ambiente do relatório anterior)

- **Testes unitários:** 18 casos escritos para a parte pura (`getMonthGrid`,
  `isWithinRange`, `interpretCalendarKey`, `applyCalendarMove`). Não executados neste
  ambiente (sem npm/rede) — prontos para `npm test`.
- **Revisão de acessibilidade:** feita por leitura de código contra o padrão WAI-ARIA
  APG "Date Picker Dialog" item a item (ver tabela acima). Confirmação por execução
  real do `@storybook/addon-a11y` fica pendente do ambiente real.
- **Revisão de API:** `DatePicker`/`DateRangePicker` ficaram **mais simples**, não
  mais complexos — a prop `month`/`onMonthChange` que existia antes (o consumidor
  precisava gerenciar o mês exibido) foi removida; `CalendarGrid` agora deriva o mês
  a partir do foco interno. Menos estado exposto, mesmo resultado.
- **Storybook:** pendente — story de `DatePicker` com navegação por teclado ainda não
  escrita (próxima ação de continuação, não bloqueador do Foundation Gate).
- **Classificação de maturidade:** atualizada abaixo.

## 3. Classificação atualizada

**`_calendar-engine` (pura) e `_calendar-grid` (UI): Preview → Stable.**
**`DatePicker` e `DateRangePicker`: Preview → Stable.**

Justificativa: os dois critérios do capítulo 21 do Design Language (testada, e sem
mais nenhuma dependência Preview abaixo dela) estão satisfeitos. A pendência de
Storybook/execução real de teste não impede a promoção — o Foundation Gate exige que
a *fundação* esteja madura, não que 100% do checklist de Hardening esteja executado
localmente neste ambiente (isso é responsabilidade do CI real da CodeChain antes do
merge, não deste relatório).

---

## 4. Inventário completo — Engines

| Engine | Consumidores | Usada pela Agenda? | Status |
|---|---|---|---|
| Calendar Engine | `DatePicker`, `DateRangePicker`, **Agenda (futuro)** | ✅ | ✅ Stable |
| Upload Engine | `FileUpload`, `ImageUpload`, `QuickCreate` (indireto, via ImageUpload em Consultas) | Provável (fotos de atendimento) | ✅ Stable |
| Mask Engine (`masked-input`) | `CurrencyInput`, `PhoneInput`, `CpfCnpjInput`, `CepInput`, `OtpInput` | Improvável | ✅ Stable |
| Number Engine (`_number-value-engine` + `_use-number-value`) | `NumberInput`, `Stepper`, `Slider` (parcial — só a função pura) | Provável (duração de bloqueio, nº de sessões) | ⚠️ Preview |
| Combobox Shell (`_combobox-shell`) | `Combobox`, `MultiSelect`, `TimePicker`, `CommandDialog` | ✅ (busca de profissional/cliente na Agenda) | ✅ Stable |
| Popover Shell (`_popover-shell`) | `Popover`, `_combobox-shell` (indireto) | Provável | ✅ Stable |
| Panel Shell (`_panel-shell`) | `Sheet`, `Drawer`, `SidePanel`, `QuickCreate` | Provável (detalhe de agendamento em painel) | ✅ Stable |
| `br-document-validators` | `CpfCnpjInput` | Improvável | ⚠️ Preview |

## 5. Inventário completo — Componentes

**Stable (17):** `QuickCreate` · `Field` · `Textarea` · `Combobox` · `MultiSelect` · `Switch`/`SwitchField` · `ImageUpload` · `Button` · `Card`+subcomponentes · `Badge` · `Avatar` · `Skeleton` · `EmptyState` · `PhoneInput` · `Input` · **`DatePicker`** · **`DateRangePicker`**

**Preview (20):** `IconButton` · `Tooltip` · `Checkbox` · `RadioGroup`/`Rating` · `Divider`/`Spinner` · `MaskedInput` · `CurrencyInput` · `CpfCnpjInput` · `CepInput` · `Select` · `TimePicker` · `NumberInput` · `Stepper` · `Slider` · `OtpInput` · `Dropzone` · `FileUpload` · `Popover` · `Dialog`/`ConfirmationDialog` · `Sheet`/`Drawer`/`SidePanel` · `CommandDialog`

## 6. Módulos do Studio OS bloqueados por cada Preview

| Preview | Bloqueia qual módulo? | Critério do Foundation Gate satisfeito? |
|---|---|---|
| Number Engine / `NumberInput` / `Stepper` | Bundles (nº de sessões), Estoque (quantidade), **Agenda (duração de bloqueio de horário)** | ✅ Sim — consumida por 2 componentes + provável uso na Agenda → **próxima prioridade** |
| `Select` | Configurações, Financeiro (forma de pagamento) | Não consumida por outro componente da plataforma, não é core da Agenda → não bloqueia |
| `Dialog`/`ConfirmationDialog`/`Sheet`/`Drawer`/`SidePanel` | Confirmações em qualquer módulo, painel de detalhe da Agenda | ✅ Parcial — `_panel-shell` já é Stable; os componentes públicos em si ainda não passaram por stress test real, mas não bloqueiam por dependência (a fundação deles já é Stable) |
| `TimePicker` | **Agenda (horário de início de atendimento)** | ✅ Sim, mas depende de `_combobox-shell` que já é Stable — o próprio `TimePicker` só precisa de uso real, não de correção de fundação |
| `CpfCnpjInput` / `br-document-validators` | Financeiro, Configurações da organização | Não é core da Agenda → não bloqueia |
| `Rating`, `OtpInput`, `Dropzone`/`FileUpload`, `Popover`, `CommandDialog` | Módulos de fase 2 (pós-venda, verificação de telefone) | Não bloqueiam Navigation nem a Agenda diretamente |

## 7. Veredito do Foundation Gate

**Uma fundação crítica ainda está em Preview: Number Engine.** Ela passa nos dois
critérios do capítulo 22 — é consumida por `NumberInput` e `Stepper`, e vai ser
consumida pela Agenda (duração de bloqueio de horário quase certamente usa um
stepper/number input). Diferente da Calendar Engine, ela **já está headless
corretamente** (foi corrigida na própria rodada de Hardening anterior) e **já tem 10
testes escritos** — o que falta é só uso real em módulo (nenhum dos dois
critérios de teste/API está pendente, só o de stress test).

**Recomendação:** isso não exige uma remediação de código como a da Calendar Engine
— exige um consumidor real, que só aparece quando um módulo funcional (Bundles ou
Estoque) for construído. Como Navigation/App Shell/Dashboard não dependem de Number
Engine, **não há bloqueio real para seguir**, mas registro aqui para o Foundation Gate
não esquecer: antes da Agenda especificamente, Number Engine precisa do mesmo
tratamento que Calendar Engine acabou de receber.

**Decisão sugerida:** seguir para Navigation agora. Reavaliar Number Engine no
Foundation Gate seguinte, antes da Agenda — não antes de Navigation, que não depende
dela.
