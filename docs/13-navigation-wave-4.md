# CodeChain Design System — Onda 4 (Navigation)

Release Gate respondido em `12-release-gate-onda-4.md` — nenhum bloqueador, Number
Engine registrada como Preview/Low Risk e explicitamente liberada para não bloquear
esta onda.

## Processo aplicado

- **Tabs** — Radix Tabs, sem sobreposição com nada existente. Teclado (setas
  esquerda/direita, Home/End) vem de fábrica.
- **Breadcrumb** — sem engine; `nav`+`ol` semântico, agnóstico de roteador (recebe o
  componente de link do app via prop, nunca importa `next/link` diretamente —
  mantém `@codechain/ui` livre de dependência de framework de roteamento).
- **Dropdown** — Radix DropdownMenu (semântica `menu`/`menuitem`, diferente de
  `listbox`/Popover). Não reaproveita `_popover-shell` como componente porque são
  primitivas Radix diferentes, mas a **aparência** é idêntica — extraí
  `_floating-surface-style.ts` (uma string de classes, não um shell) e refatorei
  `_popover-shell` para consumi-la também. Duplicação de estilo eliminada, sem forçar
  dois primitivos Radix diferentes a compartilhar um componente que não faz sentido
  compartilhar.
- **Pagination** — sem engine; a lógica de "quais páginas mostrar com reticências" é
  suficientemente pequena e de consumidor único para ficar inline, sem forçar extração
  especulativa.
- **CommandPalette** — zero peça nova de comportamento. É `CommandDialog` (Onda 3.5)
  mais um `useEffect` de atalho global (⌘K/Ctrl+K) e uma prop `items` genérica. O App
  Shell futuro só precisa montar a lista de comandos reais do Studio OS.

## Classificação inicial

Todos os 6 componentes desta onda entram como **Preview** — construídos e revisados,
ainda sem uso em módulo real. Risco pela Dependency Risk Matrix:

| Componente | Consumido por outro componente? | Consumido por módulo imediato (App Shell/Dashboard)? | Risco |
|---|---|---|---|
| `Tabs` | Não | Sim — perfil de cliente, detalhe de agendamento | MEDIUM |
| `Breadcrumb` | Não | Sim — topbar do App Shell | MEDIUM |
| `Dropdown` | Não | Sim — user menu, ações de linha de tabela | MEDIUM |
| `Pagination` | Não | Sim — lista de clientes, histórico financeiro | MEDIUM |
| `CommandPalette` | Depende de `CommandDialog` (Stable-pendente de uso) | Sim — é o ⌘K do App Shell | MEDIUM |

Nenhum CRITICAL nesta onda — o App Shell é o próximo passo natural que vai consumir
todos eles de uma vez, então o risco sobe de MEDIUM para algo a reavaliar assim que
essa onda começar.
