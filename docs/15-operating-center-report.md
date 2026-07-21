# Operating Center — Relatório de Saída
Segundo consumidor real do Workspace · decisão de promoção

---

## 1. Componentes da plataforma exercitados nesta rodada

| Componente | Exercitado como |
|---|---|
| `DecisionCard` / `DecisionBlock` (novos) | 9 cards reais em 5 blocos, cobrindo os 5 tons (`attention`, `opportunity`, `risk`, `neutral`, `positive`) |
| `TopbarSlot` + `Breadcrumb` | Breadcrumb "Operating Center" injetado na Topbar — segundo módulo usando o slot criado na rodada anterior |
| `LoadingBoundary`/`Suspense` granular | 5 blocos com fallback independente — nenhum bloco lento segura os outros |
| `EmptyState` (compact) | Bloco de Insights com estado vazio honesto (motor de IA ainda não existe) |
| `Skeleton` | `BlockSkeleton` por seção |
| `Button` (asChild + Link) | Ações dos DecisionCards |
| `ShellSidebar`/`ShellTopbar`/`SidebarNav`/`CommandPalette`/`NotificationCenter`/`UserMenu` | Herdados do layout admin — agora servindo duas rotas reais (Consultas + Operating Center) |

**Não exercitados ainda (permanecem Preview sem mudança):** `Tabs`, `Pagination`, `Dialog`/`ConfirmationDialog`, `Drawer`, `SidePanel`, `Select`, `TimePicker`, `NumberInput`/`Stepper`/`Slider`, `Rating`, `OtpInput`, `FileUpload`/`Dropzone` — nenhum caso de uso real apareceu para eles nestas duas rotas, e não inventei uso artificial só para promover.

**Exercitado parcialmente:** `Toast` — o sistema está montado (`Toaster` no `WorkspaceProvider`), mas nenhuma ação real do Dashboard dispara toast ainda (as ações são navegação, não mutação). Promover `Toast` a Stable exigiria uma mutação real usando `toast.success()` — a primeira candidata é a criação de Consulta, registrada como evolução abaixo.

## 2. O que foi promovido para a plataforma (a regra "pare, documente, promova")

- **`DecisionCard` + `DecisionBlock`** — únicos componentes novos da rodada, e nasceram em `@codechain/ui/patterns/`, não no Dashboard. O Dashboard em si não contém nenhum componente próprio: é 100% composição de plataforma + dados. A regra "se um bloco não ajuda a decidir, não existe" está aplicada — não há nenhum card de KPI puro sem ação ou consequência.

## 3. Componentes promovidos para Stable nesta rodada

- **`Breadcrumb`**: Preview → **Stable** — dois módulos reais (Consultas em 3 páginas + Operating Center), zero adaptação necessária.
- **`TopbarSlot`**: nasceu na rodada anterior, já usado por 4 páginas de 2 módulos → **Stable**.
- **`SidebarNav`, `ShellSidebar`, `ShellTopbar`, `ShellRoot`, `ShellContent`**: dois módulos reais navegando por eles → **Stable**.
- **`DecisionCard`/`DecisionBlock`**: permanecem **Preview** — um único consumidor (Operating Center). Candidato natural a segundo consumidor: o feed de Insights de IA e o topo da Agenda.

## 4. Permanecem Preview (com risco reavaliado)

| Item | Risco | Motivo |
|---|---|---|
| `CommandPalette`, `NotificationCenter`, `UserMenu`, `WorkspaceSwitcher` | MEDIUM | Montados e funcionais nas duas rotas, mas "montado no layout" não é o mesmo que "exercitado por fluxo real" — ninguém navegou por eles em teste de uso de verdade ainda |
| `Toast` | MEDIUM→HIGH | Sistema montado, zero disparo real. Sobe para HIGH porque toda mutação futura (criar consulta, aprovar orçamento) depende dele |
| `Dialog`/`ConfirmationDialog` | MEDIUM | Sem consumidor ainda — primeira ação destrutiva real (arquivar consulta) é o gatilho |
| Number Engine | LOW (inalterado) | Continua sem consumidor de módulo |

## 5. Evoluções necessárias identificadas

1. **`toast.success()` na criação de Consulta** — a mutação real mais próxima; fecha o ciclo do Toast e o promove.
2. **`DecisionCard` com estado de dismissal** — a gestora vai querer dispensar um card já tratado ("já enviei os lembretes"). Não construído agora porque nenhum uso real confirmou a necessidade — registrado como hipótese a validar com a Nataly, não como pendência técnica.
3. **`WorkspaceSwitcher` não está montado no layout admin** — o header da Sidebar hoje é texto estático ("Casa Nataly Rodrigues"). Com um único tenant real, o switcher seria decorativo; entra quando a segunda organização existir (fase SaaS). Registrado para não parecer esquecimento.

## 6. Lições aprendidas

- **Suspense por bloco foi a decisão certa de performance percebida** — o Operating Center nunca mostra tela em branco; blocos populam conforme chegam (cap. 17.3 do Design Language aplicado na prática, não só documentado).
- **A forma do `AIInsight` definida agora, vazia de propósito, é o espaço arquitetural da IA pedido** — quando o motor nascer (item 17 do roadmap), ele popula uma interface que o Dashboard já consome; zero refactor no front.
- **"Informação sem ação não agrega valor" é um ótimo filtro de escopo**: dois blocos que eu esboçaria por hábito (gráfico de faturamento semanal, contagem total de clientes) morreram no critério — nenhum respondia "o que devo fazer agora?".

## 7. Status do Workspace — recomendação

O critério oficial ("dois módulos reais") está tecnicamente atendido: Consultas e
Operating Center consomem o Workspace completo sem nenhuma adaptação de layout.

**Minha recomendação, porém, é promover com uma ressalva explícita:** os dois módulos
são relativamente "bem-comportados" (listas, formulário, cards). O Workspace ainda
não foi estressado por um módulo denso e interativo — e a Agenda, que é exatamente
isso, vem aí. Sugiro: **Workspace → Stable agora** (o critério definido foi cumprido,
mudar a régua depois do jogo seria pior que a ressalva), com a Agenda funcionando
como o teste de fogo que pode reabrir pontos específicos via o processo normal de
achados — não como condição suspensiva da promoção.

Decisão final é sua.
