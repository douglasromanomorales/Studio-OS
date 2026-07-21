# Relatório de Validação — Módulo Consultas
Teste de estresse do CodeChain Design System em produto real

---

## 1. Componentes que funcionaram perfeitamente, sem nenhuma adaptação

- `Field`, `Textarea`, `Button`, `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardFooter`, `Badge`, `Avatar` — usados exatamente como documentado, zero atrito.
- `SwitchField` — o par label+descrição+switch resolveu "já fez química antes" e "alergia conhecida" sem nenhuma composição extra.
- `ImageUpload` — funcionou de ponta a ponta com um `transport` mock, incluindo preview local instantâneo antes do "envio" terminar. Validou a decisão de injeção de dependência: trocar o mock por Supabase Storage real é uma troca de uma função, não de componente.
- `Skeleton` (primitivo puro) — composição livre para o formato exato da linha de consulta.
- `EmptyState` — usado como estava documentado, sem ajuste.

**Confirma:** a hipótese central da plataforma — primitivos bem desenhados não precisam saber nada do domínio de beleza para servir um formulário de beleza real.

---

## 2. Componentes que precisaram evoluir (e por quê)

| Componente | Limitação encontrada | Genérica ou específica de Consultas? | Ação |
|---|---|---|---|
| `Combobox` | Sem prop `id` — `Field`/`htmlFor` não conseguia associar o label ao controle | Genérica — qualquer formulário com Combobox tinha o mesmo problema | Corrigido em `@codechain/ui`: `id` adicionado ao trigger |
| `MultiSelect`, `DatePicker`, `TimePicker` | Mesmo problema de `id` ausente | Genérica | Corrigido nos quatro componentes de uma vez, mesma causa raiz |
| `Combobox.emptyText` | Tipado como `string`, impossível colocar um botão "Criar novo cliente" quando a busca não encontra ninguém | Genérica — criar-a-partir-da-busca é padrão comum (cliente, tag, categoria) | Ampliado para `React.ReactNode` (mudança não-quebradora) em `Combobox` e `MultiSelect` |
| `SkeletonCard` | Formato fixo (label pequeno + valor grande) não serve para skeleton de linha de lista | Achado de uso, não bug — o preset está correto para o que foi desenhado (Stat Card) | Nenhuma mudança na plataforma; documentado que presets nomeados não devem ser forçados fora do formato deles — usar o `Skeleton` primitivo puro para formas novas |

**Confirma:** a regra "se for recorrente, sobe pra plataforma; se for específico, fica no módulo" funcionou na prática — os três primeiros achados eram claramente recorrentes (afetavam 4 componentes por uma única causa), o quarto era um caso de uso mal aplicado, não uma lacuna real.

---

## 3. Abstrações que se provaram corretas

- **`_combobox-shell.tsx`** — usado por `Combobox`, `MultiSelect`, `TimePicker` e agora também implicitamente correto para o próximo `Dialog`/`Sheet` de criação rápida de cliente (mesmo padrão de popover+lista se aplicaria a uma busca dentro do Dialog). A extração se pagou de novo nesta rodada.
- **Upload Engine com transporte injetado** — a decisão mais importante da Onda 3e passou no teste real: o módulo Consultas nunca precisou saber que o transporte era um mock, e trocar para Supabase Storage é uma mudança de uma linha (a função `transport`), não de arquitetura.
- **Tokens semânticos** — `NovaConsultaForm` inteiro foi escrito sem um único hex. Trocar o tema da Casa Nataly por outro amanhã não exige tocar em nenhuma linha deste módulo.
- **`Field` desacoplado do Input** (decisão da Onda 3a) — validado por uso real: `Field` envolveu `Combobox`, `MultiSelect`, `DatePicker` e `Textarea` sem nenhuma adaptação, exatamente como projetado.

---

## 4. Abstrações que precisaram de ajuste fino (não estavam erradas na essência, mas incompletas)

- **`Combobox`/`MultiSelect`/`DatePicker`/`TimePicker` sem `id`** — não era um erro de design, era uma omissão: a acessibilidade via `Field`/`htmlFor` foi documentada como princípio (seção 8 do Design Language) mas não testada contra um formulário real até agora. É exatamente o tipo de lacuna que só aparece em uso de verdade, não em revisão de código isolada.

Nenhuma abstração precisou ser refeita do zero. O padrão Headless First (Onda 3d/3e) não foi nem tocado — `_number-value-engine` e `_upload-engine` funcionaram sem qualquer ajuste.

---

## 5. Engines que provaram ser reutilizáveis fora do contexto em que nasceram

- **Upload Engine** — nasceu pensando em documentos genéricos (Onda 3e), mas serviu perfeitamente ao caso de fotos de prontuário-like (fotos de consulta) sem nenhuma mudança. Primeira evidência real de que vai servir também a Sofia IA/CRM como planejado na justificativa original.
- **`_combobox-shell`** — três consumidores diferentes (`Combobox`, `MultiSelect`, `TimePicker`) já validado nas ondas anteriores; o módulo Consultas usou dois deles lado a lado no mesmo formulário sem conflito.

---

## 6. APIs públicas que precisam ser simplificadas

Nenhuma. A superfície pública usada pelo módulo (`Field`, `Textarea`, `Combobox`, `MultiSelect`, `SwitchField`, `DatePicker`, `ImageUpload`, `Button`, `Card*`, `Badge`, `Avatar`, `Skeleton`, `EmptyState`) permaneceu pequena e legível — nenhum componente exigiu mais que 4-5 props para o caso de uso real. É o resultado esperado do princípio "poucas portas de entrada".

---

## 7. Decisões arquiteturais confirmadas

- **Tokens semânticos vs. tema** — confirmada sem ressalva.
- **Headless First / Engine → Adapter → UI** — confirmada; nenhuma engine vazou responsabilidade de UI durante uso real.
- **Consulta separada de Orçamento** (decisão de duas mensagens atrás) — confirmada pelo schema: o módulo Consultas não precisou de nenhum campo de preço, reforçando que a separação de responsabilidade estava certa.
- **`ServiceBundle` vs `PackageTemplate`** (decisão da fase de arquitetura original) — não testada nesta rodada (Consultas não toca em pacotes), permanece válida mas sem nova evidência.

## 8. Decisões que precisam ser revistas

- **Ausência de `Dialog`/`Sheet`** — não chegou a ser testada porque não existe. Isso não invalida nenhuma decisão anterior, mas expõe que a repriorização de Onda 2 → Ondas 3a-3e derrubou um composite de uso extremamente comum (qualquer "criar X sem sair da tela") para depois de Forms inteiro. **Recomendação:** priorizar `Dialog`/`Sheet` no início da próxima onda de Composites, antes mesmo de Navigation completa — o módulo Consultas já provou que vai precisar dele no primeiro fluxo real (cadastro rápido de cliente), e a Agenda vai precisar ainda mais.

---

## 9. Veredito

A plataforma sustentou um módulo funcional completo — schema, validação de domínio (Zod, gate de Teste de Mechas), Server Actions, Server/Client Components, formulário de 4 seções, fila com estado vazio e de carregamento, e página de detalhe — usando **17 componentes públicos de `@codechain/ui`** sem nenhuma reescrita de componente existente, apenas 4 correções pontuais (todas de acessibilidade/tipagem, não de arquitetura) e a identificação de uma lacuna real (`Dialog`/`Sheet`) antes de ela custar caro na Agenda.

Isso é evidência concreta a favor de seguir para a Onda 4 — com `Dialog`/`Sheet` promovidos para o topo da fila.
