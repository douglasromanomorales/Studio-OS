# CodeChain Design System — Workspace
Shell (infraestrutura técnica) + Workspace (experiência configurada)

## 1. Divisão de nomenclatura adotada

```
Shell       → src/workspace/shell-*.tsx + _shell-context.tsx
              Infraestrutura técnica: grid de layout, estado de colapso/mobile,
              slot de topbar, skip-link. Não sabe o que é "Studio OS".

Workspace   → src/workspace/workspace-provider.tsx + as peças de navegação
              (SidebarNav, WorkspaceSwitcher, UserMenu, NotificationCenter)
              A experiência configurada por cima do Shell. Recebe config
              (tema, itens de comando) e composição (children) — nunca hardcoda
              nome de produto.
```

Ambos vivem em `@codechain/ui` (não em pacote próprio) — mesma decisão já tomada
sobre Forms: Shell/Workspace são consumidos por todo produto CodeChain, então
separá-los em outro pacote seria a mesma fricção de import artificial já rejeitada
na ADR de topologia de pacotes.

## 2. As 4 camadas — responsabilidade única, sem conhecimento cruzado

| Camada | Componentes | Conhece as outras camadas? |
|---|---|---|
| **Navigation** | `ShellSidebar`, `ShellTopbar`, `Breadcrumb`, `WorkspaceSwitcher` | Não — recebe `children`/config genéricos |
| **Content** | `ShellContent` (só um `<main>` focável) | Não — nunca importa Sidebar/Topbar |
| **Overlay** | `Dialog`, `Sheet`, `CommandPalette`, `Dropdown`, `Popover`, `QuickCreate` | Não precisou de wiring extra — todos já usam `Portal` do Radix, que renderiza fora da árvore de qualquer camada. A disciplina da Overlay Layer já vinha garantida desde a Onda 3.5, só formalizada em documento agora. |
| **Feedback** | `Toast`/`Toaster`, `ErrorBoundary`, `LoadingBoundary` | Não — `ErrorBoundary`/`LoadingBoundary` envolvem a Content Layer de fora, nunca o contrário |

## 3. Achado real e correção na plataforma (não no módulo)

Ao ligar o módulo Consultas ao Workspace, a `Topbar` — montada uma única vez pelo
layout — não tinha como mostrar um `Breadcrumb` diferente por página sem que o
próprio módulo passasse a controlar a Topbar (violando a regra "nenhum módulo
controla Sidebar/Topbar").

**Correção na plataforma:** `_shell-context` ganhou um slot dinâmico
(`topbarLeft`/`setTopbarLeft`) e um novo componente público, `TopbarSlot` — qualquer
página da Content Layer injeta conteúdo na Topbar já montada, sem que o layout saiba
nada sobre a página, e sem que a página precise saber que existe uma Topbar por trás.
Aplicado nas 3 páginas do módulo Consultas (fila, nova consulta, detalhe) como prova
de que resolve o problema de verdade.

## 4. Achado real #2: Toast nunca tinha sido construído

Estava na lista de Primitives desde a mensagem que abriu a Onda 1, sobreviveu a
todas as reorganizações de roadmap sem nunca ganhar um arquivo. A Feedback Layer não
fecha sem ele — construído agora (`primitives/toast.tsx`), com fila imperativa
(`toast.success(...)`) por cima do Radix Toast, que é declarativo por padrão.

## 5. Critérios de qualidade — status real, sem inflar

| Critério | Status |
|---|---|
| Navegação por teclado | `⌘K` abre Command Palette, `⌘B` colapsa Sidebar — ambos via `useKeyboardShortcut` compartilhado (extraído nesta rodada, 2º consumidor real). Radix cobre o resto (Dialog/Sheet/Dropdown/Popover). |
| Responsividade | Sidebar vira `Sheet` lateral abaixo de 1024px; breakpoint centralizado em `_shell-context` (`matchMedia`), não espalhado em CSS solto |
| Acessibilidade | Skip-link, `<main tabIndex={-1}>`, `aria-label` em nav/notificações; não auditado por `axe-core` real neste ambiente (mesma ressalva do relatório de Hardening) |
| Performance | Nenhuma dependência nova pesada; `ShellSidebar`/`ShellTopbar` são Client Components por necessidade real (estado de colapso, media query), `ShellContent` não precisa e não é |
| Re-renderizações | Contexto do Shell dividido do necessário — `topbarLeft` muda a cada navegação, mas só `ShellTopbar` consome esse campo, não a árvore inteira |
| Focus Management | Skip-link + Radix restaura foco ao trigger ao fechar overlays (comportamento nativo, confirmado por leitura de código, não reimplementado) |
| Screen Readers | Roles/labels presentes; não testado com leitor de tela real neste ambiente |
| Estados vazios | `NotificationCenter` usa `EmptyState` (`size="compact"`) quando não há notificação |
| Estados de carregamento | `LoadingBoundary` com skeleton padrão, usado pelo `ErrorBoundary`+`Suspense` do layout admin |
| Offline | `StatusBar` detecta via `navigator.onLine` + eventos — comunica, não tenta sincronizar (fora de escopo até um módulo pedir fila offline real) |

## 6. Classificação de maturidade

**Workspace: Experimental → Preview.** Passou da fase de esboço porque já tem um
consumidor real completo (Consultas, as 3 páginas). **Não é Stable ainda** — a regra
que vocês definiram exige **dois módulos reais**, e só existe um até aqui. Fica
Preview até a Agenda ou outro módulo (Financeiro, Clientes) também consumir o
Workspace sem adaptação.

**Risco pela Dependency Risk Matrix:** Workspace é consumido por todo o painel
administrativo e será consumido por todo módulo futuro — critério de CRITICAL por
definição, mas **não bloqueia** porque já está em uso ativo, sendo corrigido em
tempo real (exatamente o processo "pare, documente, corrija na plataforma" que
gerou os dois achados desta rodada). Risco CRITICAL não significa parar — significa
que é a prioridade de estabilização mais alta do momento, o que já está acontecendo.

## 7. Pendências registradas, não escondidas

- Nenhuma story de Storybook escrita para as peças do Workspace ainda.
- `Dashboard` (item 6 do roadmap) ainda não existe como rota — o item de navegação
  "Dashboard" no `AdminNav` aponta para `/`, que retorna 404 até essa onda começar.
  Não construí uma versão fake só para preencher — seria antecipar uma onda que tem
  processo próprio.
- Testes de teclado/leitor de tela reais (não só leitura de código) continuam
  pendentes do ambiente real, mesma ressalva de todo relatório anterior.
