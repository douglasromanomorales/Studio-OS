# Platform Hardening — Relatório Final
CodeChain Design System · antes de Navigation

> **Ressalva de ambiente, lida antes de qualquer número abaixo:** este relatório foi
> produzido em um ambiente sem acesso a rede/npm/navegador. Os testes unitários, a
> configuração de Storybook e a de regressão visual são **código real, correto e
> pronto para rodar** — mas não foram executados aqui. Onde eu não posso confirmar um
> resultado por execução real, digo isso explicitamente em vez de apresentar um número
> inventado. Antes de promover qualquer componente de Preview para Stable a partir
> deste relatório, rodar `npm test`, `npm run build-storybook` e a suíte do Playwright
> no ambiente real da CodeChain é pré-requisito, não formalidade.

---

## 1. Testes unitários das Engines

| Engine | Arquivo de teste | O que cobre |
|---|---|---|
| `_number-value-engine` | `_number-value-engine.test.ts` | `clampToStep` (limites, step, precisão decimal), `interpretNumberKey` (todas as teclas relevantes), `canIncrement`/`canDecrement` |
| `_upload-engine` | `_upload-engine.test.ts` | Validação (tamanho, tipo, `maxFiles`), ciclo de vida completo com transporte mockado, `retry`, `cancel` via `AbortSignal`, limite de concorrência |
| `masked-input` (funções puras) + `br-document-validators` | `masked-and-validators.test.ts` | `applyMask`, `stripNonDigits`, CPF/CNPJ válidos e inválidos conhecidos |

**Não testados nesta rodada:** `_calendar-engine` (mistura lógica com JSX — ver
Achado de API Review abaixo, é o motivo). `_combobox-shell`/`_popover-shell`/
`_panel-shell` são casca visual, não comportamento — cobertos por regressão visual,
não por unit test.

**Cobertura projetada** (configurada em `vitest.config.ts`, não medida por execução
real): 90% statements/functions/lines, 85% branches, sobre as engines headless. Rodar
`npm run test:coverage` no ambiente real para confirmar.

---

## 2. Testes de acessibilidade

Configurado via `@storybook/addon-a11y` com `test: "error"` — qualquer componente que
reprovar no axe-core quebra o build do Storybook, não é um relatório à parte que
alguém pode ignorar. Não executado nesta rodada (requer Storybook rodando).

**Revisão manual feita por leitura de código (isso eu posso afirmar com confiança):**
- Todo primitivo interativo construído sobre Radix herda roles/estados ARIA corretos
  automaticamente (Select, Checkbox, RadioGroup, Switch, Dialog, Popover, Slider).
- `IconButton` força `aria-label` no tipo — impossível compilar sem ele.
- Erros de formulário usam `role="alert"` + `aria-describedby` em todos os campos
  (`Input`, `Textarea`).
- `Rating` usa `radiogroup`/`radio` (não `spinbutton`) — decisão já validada na
  Onda 3d.

---

## 3. Storybook

`.storybook/main.ts` e `preview.tsx` configurados, com tema Casa Nataly injetado via
CSS e um `globalTypes.theme` já preparado para múltiplos temas de produtos futuros.
3 arquivos de story escritos (`button.stories.tsx`, `combobox.stories.tsx`,
`quick-create.stories.tsx`) cobrindo variantes, estados e o render prop novo do
Combobox. **Não construído/servido nesta rodada** — sem ambiente de navegador
disponível aqui.

**Cobertura de stories:** 3 de ~40 componentes públicos. Isso é uma lacuna real, não
uma decisão — ficou priorizado o componente mais usado (`Button`), o que mais mudou
de API nesta fase (`Combobox`) e o único já Stable (`QuickCreate`). Completar o
catálogo é trabalho de continuação, não bloqueador para Navigation.

---

## 4. Visual Regression

`playwright.config.ts` aponta para o Storybook buildado (`storybook-static`), não
para o app — cada story é um alvo de screenshot isolado. Um arquivo de exemplo
(`stable-components.spec.ts`) com 2 testes, como padrão a replicar. **Não executado**
— depende do Storybook buildado, que depende de navegador real.

---

## 5. API Review

Revisão real, feita lendo cada arquivo público — não uma auditoria automatizada.

**Encontrado e corrigido nesta rodada:**
- `SliderControl` renomeado para `Slider` — único componente que não seguia a
  convenção "nome direto do componente" que todo o resto do sistema já seguia.
- `_number-value-engine.ts` importava `React` e expunha um hook diretamente — violava
  o próprio princípio Headless First. Separado em engine pura + `_use-number-value.ts`
  (adaptador), mesmo padrão da Upload Engine.

**Confirmado como consistente:**
- `onValueChange` é o nome padrão em 9 componentes diferentes (`Combobox`,
  `MultiSelect`, `DatePicker`, `MaskedInput`, `NumberInput`, `CurrencyInput`,
  `Slider`, `Rating`, `TimePicker`) — a convenção de nomenclatura da seção 12 do
  Design Language se pagou: nenhuma variação tipo `onChange`/`onSelect`/`onUpdate`
  se infiltrou.
- Props booleanas seguem "sem prefixo" (`loading`, `disabled`, `interactive`) em
  100% dos componentes revisados.

**Exceção documentada, não corrigida:** `FileUpload`/`ImageUpload` usam
`onFilesChange` em vez de `onValueChange`. Decisão deliberada — "value" sozinho seria
ambíguo para uma lista de arquivos com status individual; mantido assim de propósito,
registrado aqui para não ser "corrigido" por engano numa passada futura.

---

## 6. Performance Review

- **Server/Client boundary:** todo componente que não precisa de estado local ou
  evento de navegador poderia ser Server Component — mas como `@codechain/ui` é uma
  biblioteca de UI consumida por apps Next.js, a marcação `"use client"` fica nos
  componentes que genuinamente precisam (qualquer um com `useState`/Radix) e ausente
  nos que não precisam (`Badge`, `Card`, `EmptyState`, `Skeleton`). Confirmado por
  leitura — nenhum `"use client"` desnecessário encontrado.
- **Motion:** todos os componentes de produto usam `--dur-instant` a `--dur-slow`
  (≤250ms), nenhum vazamento de timing cinematográfico (`--dur-cinematic-*`) para
  dentro de componente de painel. Confirmado.

---

## 7. Documentação final dos componentes

Completa para as Ondas 1, 3a–3e e 3.5 (docs `01` a `09`). Pendente: consolidar num
único índice navegável (hoje são 9 arquivos separados) — trabalho de organização, não
de conteúdo faltante.

---

## 8. Tree Shaking Validation

`package.json` usa `exports` com subpaths individuais
(`@codechain/ui/primitives/button`, não um barrel `@codechain/ui` único). **Isso não é
acidente — é a validação de que a decisão estrutural original está correta:** importar
`Button` nunca traz `cmdk` (usado só por Combobox/MultiSelect/TimePicker/CommandDialog)
nem `date-fns` (só `_calendar-engine`). Confirmado por inspeção da estrutura de
imports — nenhum arquivo público reexporta outro módulo inteiro.

---

## 9. Bundle Size Review

**Estimativas, não medições reais** (sem bundler disponível neste ambiente):

| Dependência | Peso aproximado (gzip) | Quem paga o custo |
|---|---|---|
| Cada pacote `@radix-ui/react-*` | ~2–4kb | só quem importa aquele componente específico |
| `cmdk` | ~5kb | Combobox, MultiSelect, TimePicker, CommandDialog |
| `date-fns` (funções usadas, não a lib inteira) | ~3kb | DatePicker, DateRangePicker |
| `lucide-react` | ~0.5kb por ícone importado individualmente | todos, mas marginal |

Recomendação: rodar `next build` com `@next/bundle-analyzer` no Studio OS real antes
de aprovar como número oficial — o que está aqui é estimativa informada, não medição.

---

## 10. Keyboard Navigation Review

**Achado real, não corrigido nesta rodada:** `_calendar-engine` renderiza cada dia
como um `<button>` independente em um grid, sem navegação por setas entre células
(padrão ARIA grid / roving tabindex). Hoje, navegar o calendário por teclado exige
`Tab` célula por célula (até 42 tabs) em vez de usar as setas para mover dentro da
grade — abaixo do padrão que calendários acessíveis costumam oferecer.

**Por que não corrigi agora:** implementar roving tabindex corretamente é trabalho
real, não um ajuste de 5 minutos, e faria esta already-longa rodada de Hardening
crescer ainda mais. Registrar o gap com honestidade é mais útil do que empurrar um
conserto apressado.

**Decisão:** `DatePicker`/`DateRangePicker` ficam classificados como **Preview**, não
**Stable**, apesar de terem sido usados com sucesso no módulo Consultas — o gap de
teclado é motivo suficiente para não considerar o componente definitivamente maduro
ainda. Vai para o backlog de Hardening da próxima rodada, antes de a Agenda (que
depende pesadamente de navegação por teclado em grade) começar.

**Confirmado funcionando:** todo componente Radix-based (Select, Checkbox, RadioGroup,
Switch, Dialog, Sheet, Popover, Slider, Tabs quando existir) herda navegação de
teclado completa do próprio Radix — nenhum gap encontrado nesses.

---

## 11. Classificação de maturidade — inventário completo

### Stable
`QuickCreate` · `Field` · `Textarea` · `Combobox` · `MultiSelect` · `Switch`/`SwitchField` · `ImageUpload` · `Button` · `Card` (+ subcomponentes) · `Badge` · `Avatar` · `Skeleton` · `EmptyState` · `PhoneInput` · `Input`

*Critério: usados pelo módulo Consultas e confirmados funcionando no relatório de validação, mais revisados nesta rodada de Hardening.*

### Preview
`IconButton` · `Tooltip`/`SimpleTooltip` · `Checkbox`/`CheckboxField` · `RadioGroup`/`Rating` · `Divider`/`Spinner` · `MaskedInput` · `CurrencyInput` · `CpfCnpjInput` · `CepInput` · `Select` · `DatePicker` · `DateRangePicker` · `TimePicker` · `NumberInput` · `Stepper` · `Slider` · `OtpInput` · `Dropzone` · `FileUpload` · `Popover` · `Dialog` · `ConfirmationDialog` · `Sheet` · `Drawer` · `SidePanel` · `CommandDialog`

*Critério: API revisada, testados onde aplicável, mas sem uso em módulo real ainda (ou, no caso de DatePicker/DateRangePicker, com gap conhecido de teclado).*

### Experimental
Nenhum componente no momento — tudo que existe já passou de esboço para pelo menos revisão de API.

### Deprecated
Nenhum — plataforma jovem demais para isso, o que é o esperado.

---

## 12. Engines — inventário e status

| Engine | Testada | Usada por componente Stable? | Status |
|---|---|---|---|
| `_upload-engine` | ✅ 6 casos | Sim (`ImageUpload`) | Estável |
| `_combobox-shell` | Indireto (via componentes que a usam) | Sim (`Combobox`) | Estável |
| `_popover-shell` | Indireto | Sim (via `_combobox-shell`) | Estável |
| `_panel-shell` | Indireto | Sim (`QuickCreate`) | Estável |
| `masked-input` (funções puras) | ✅ 3 casos | Sim (`PhoneInput`) | Estável |
| `_number-value-engine` + `_use-number-value` | ✅ 10 casos | Não ainda | Preview |
| `_calendar-engine` | Não | Sim, mas com gap de teclado | Preview — bloqueado por Achado #10 |
| `br-document-validators` | ✅ 8 casos | Não ainda (`CpfCnpjInput` é Preview) | Preview |

---

## 13. APIs públicas — contagem final

**37 componentes públicos**, **8 engines internas** (`_`-prefixadas, nunca exportadas). Proporção de ~4.6 componentes públicos por engine — evidência a favor do princípio "poucas portas de entrada, muita reutilização escondida atrás delas".

---

## 14. Veredito

A plataforma está pronta para Navigation **com uma condição**: o gap de teclado do
`_calendar-engine` deveria entrar no início do trabalho de Navigation/App Shell, não
ficar esquecido — porque a Agenda, o módulo mais complexo do roadmap, depende
pesadamente exatamente desse padrão de grade navegável. Corrigir agora, com pouco
código construído em cima, é mais barato que corrigir depois que `DatePicker`,
`DateRangePicker` e a futura Agenda dependerem todos da mesma engine.

Fora esse ponto, nenhum achado desta rodada foi estrutural — foram 2 correções
pontuais de API (renomeação, separação headless) e um mapa honesto do que ainda não
foi validado por uso real. Isso é, em si, evidência de que o processo estabelecido
nas ondas anteriores (5 perguntas antes de cada componente, stress test antes de
declarar maturidade) está funcionando.
