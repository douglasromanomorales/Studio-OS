# CodeChain Design System — Onda 3.5 (Composites)

Nascida do relatório de validação do módulo Consultas — a única onda até agora
motivada por uma lacuna encontrada em uso real, não por planejamento antecipado.

## Extrações internas (2 shells, 0 engines de comportamento novo)

- **`_popover-shell.tsx`** — casca visual de conteúdo flutuante, extraída da
  duplicação real entre o `_combobox-shell` (Onda 3b) e o novo `Popover` público.
  `_combobox-shell` foi refatorado para consumi-la em vez de duplicar.
- **`_panel-shell.tsx`** — casca de painel deslizante (header/body/footer, lado
  configurável, modal ou não), compartilhada por `Sheet`, `Drawer`, `SidePanel` e
  `QuickCreate`. Nenhuma das quatro reimplementa foco/scroll-lock/animação — o Radix
  Dialog, já usado com `modal={true|false}`, é o motor real por baixo; não construímos
  uma engine própria porque uma compatível já existe.

Nenhuma engine de comportamento nasceu nesta onda — só reorganização de casca visual
repetida. Consistente com "nenhum motor novo enquanto existir um compatível".

## Componentes públicos entregues (9 de 11 — 2 adiados)

| Componente | Base | Decisão |
|---|---|---|
| `Popover` | `_popover-shell` + Radix Popover | Novo, não-modal, para conteúdo leve |
| `Dialog` | Radix Dialog, casca própria | Modal centralizado — não compartilha shell com painel lateral (forma diferente de propósito) |
| `ConfirmationDialog` | `Dialog` | Preset — título/descrição/confirmar/cancelar padronizados |
| `Sheet` | `_panel-shell` (modal, lado direito) | — |
| `Drawer` | `_panel-shell` (modal, lado inferior) | Preset de Sheet; sem swipe-to-dismiss nesta versão (ver nota de escopo no arquivo) |
| `SidePanel` | `_panel-shell` (`modal={false}`) | Mesmo shell do Sheet, variante não-modal via prop nativa do Radix |
| `QuickCreate` | `Sheet` | Resolve o Achado #3 do relatório de validação — "criar cliente sem sair da tela" |
| `CommandDialog` | `Dialog` centralizado + `Command` (Onda 3b) | Zero peça nova — base literal do futuro Command Palette do App Shell |
| `Combobox` (evolução) | — | API migrada de props fixas (`emptyText: string`) para render props (`renderItem`/`renderEmpty`/`renderLoading`/`renderHeader`/`renderFooter`), todas opcionais, comportamento padrão preservado |

## Adiados — sem consumidor real (mesmo critério já aplicado a Filter Builder)

- **`InlineCreate`** — o gargalo real (Consultas) pedia criação em painel, não criação
  dentro do próprio campo. Nenhum módulo define essa necessidade ainda.
- **`Wizard`** — nenhum fluxo multi-etapa foi validado; Consultas coube em página
  única.
- **`ActionPanel`** — nome ambíguo, sobreposto com `Sheet`+`QuickCreate`. O caso de
  uso mais provável ("ações em massa sobre N itens selecionados") é uma barra
  flutuante, forma diferente da que o nome sugere — melhor esperar um módulo real
  (Clientes ou Financeiro com seleção múltipla) definir a forma certa do que adivinhar.

## Loop fechado com o módulo Consultas

`QuickCreate` substituiu o `alert()` placeholder deixado no formulário de intake —
"Cadastrar novo cliente" agora abre um painel real com `Field`+`Input`+`PhoneInput`,
usando a Server Action `createCustomerQuickAction`. É a primeira vez que um composite
nasce, é usado pelo módulo que motivou sua criação, na mesma rodada.

## Regra de estabilidade oficializada nesta rodada

Nenhum componente é considerado estável só por existir com documentação — precisa
sobreviver a um stress test em módulo real primeiro:

```
Desenvolvimento → Uso real → Relatório → Refatoração → Aprovação → Plataforma
```

Os 9 componentes desta onda ainda não passaram por esse ciclo completo (só o
`QuickCreate` teve uso real imediato, dentro desta própria rodada). Ficam com status
"em validação" até o próximo módulo vertical (provavelmente Orçamentos, já que
reaproveita `Consulta`) exercitar `Dialog`, `Sheet`, `ConfirmationDialog` e
`CommandDialog` de verdade.
