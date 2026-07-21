# Studio OS — Design System
CodeChain Automações · Onda 1: Foundations + 8 primitivos atômicos

> Este design system nasce **desacoplado de qualquer regra de negócio da Casa Nataly**.
> Nenhum componente aqui sabe o que é um "Agendamento" ou um "Orçamento" — eles recebem
> variantes, conteúdo e callbacks genéricos. Isso é o que torna o Studio OS reaproveitável
> para qualquer salão/clínica que assine o SaaS no futuro.

---

## 1. Foundations

### 1.1 Tokens de cor

Extraídos do código-fonte real do site institucional (fonte da verdade, não aproximação).

| Token | Hex | Uso |
|---|---|---|
| `--color-off-white` | `#F7F4EF` | Fundo padrão do produto |
| `--color-beige` | `#E9D7BF` | Acentos suaves, hover states discretos |
| `--color-terracotta` | `#B85A3D` | Cor de marca — ações primárias, foco, destaque |
| `--color-terracotta-dark` | `#9A4A31` | Hover/active de ações primárias, eyebrows |
| `--color-brown` | `#4A3428` | Texto padrão, superfícies escuras |
| `--color-ink` | `#18120E` | Texto de alto contraste, tooltips |
| `--color-white` | `#FFFFFF` | Superfícies de input, texto sobre cor sólida |

**Regra de uso:** nunca usar preto puro (`#000`) ou cinza neutro puro para texto/sombra — tudo deriva de `--color-ink`/`--color-brown`, o que dá a "tinta quente" característica da marca mesmo em elementos utilitários como sombras e skeletons.

### 1.2 Tipografia

- **Display:** `Playfair Display` (itálico para destaque emocional, ex: títulos de seção, valores monetários grandes)
- **Corpo/UI:** `Inter` (toda interface funcional: labels, botões, tabelas, formulários)

| Escala | Tamanho | Peso | Uso |
|---|---|---|---|
| Display XL | 40px | 500 | Headlines de landing/portal |
| Display L | 28px | 500 | Título de página no painel |
| Display M | 20px | 500 | Título de card/seção |
| Body L | 15px | 400 | Corpo de destaque |
| Body M | 14px | 400 | Corpo padrão (tabelas, listas) |
| Body S | 13px | 500 | Labels de formulário |
| Caption | 11-12px | 600, uppercase, tracking .18em+ | Eyebrows, headers de tabela |

**Regra:** `Playfair Display` só aparece em títulos e em valores que merecem destaque emocional (ex: nome do cliente no cabeçalho do perfil). Nunca em botões, inputs, tabelas ou navegação — ali é sempre `Inter`.

### 1.3 Espaçamento

Escala de 4px-base: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`. Componentes internos (padding de botão, gap entre ícone e texto) usam os valores menores; espaçamento entre seções/cards usa os maiores. Nunca valores fora da escala (ex: `13px`, `22px`) exceto em ajustes tipográficos finos (`line-height`, `letter-spacing`).

### 1.4 Grid

- Painel administrativo: `--app-max-width: 1440px`, sidebar fixa (260px expandida / 72px colapsada) + área de conteúdo fluida.
- Marketing/portal: `--container-marketing: 1240px`, `--gutter` responsivo (`clamp(20px, 5vw, 80px)`).
- Breakpoints seguem o padrão Tailwind (`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`).

### 1.5 Elevação

Sombras com tinta quente (`rgba(24,18,14, α)`), nunca preto puro — mantém a superfície "parte da mesma casa" mesmo em UI utilitária.

| Token | Uso |
|---|---|
| `--shadow-xs` | Bordas sutis de card em repouso |
| `--shadow-sm` | Dropdown, popover |
| `--shadow-md` | Dialog, card elevado no hover |
| `--shadow-lg` | Sheet lateral, modal grande |
| `--shadow-focus` | Anel de foco em terracota — substitui outline padrão do browser em elementos custom |

### 1.6 Motion

Duas famílias deliberadamente distintas:

- **Marca** (`--ease-brand`, `--dur-brand-*`): timings cinematográficos (500ms–1.6s) para landing e portal do cliente — onde o produto é vitrine.
- **Produto** (`--ease-product`, `--dur-instant` a `--dur-slow`, 100–350ms): micro-interações do painel administrativo — onde velocidade percebida importa mais que espetáculo. Nunca usar timing de marca em um botão de tabela; a gestora usa isso 8h por dia.

`prefers-reduced-motion: reduce` é respeitado globalmente (ver `globals.css`), desativando toda animação automaticamente — não é opt-in por componente.

### 1.7 Acessibilidade — princípios transversais

- Todo elemento interativo tem foco visível (`--shadow-focus`), nunca `outline: none` sem substituto.
- Contraste mínimo AA (4.5:1 texto normal, 3:1 texto grande) validado para todos os pares cor-de-fundo × cor-de-texto do tema.
- Componentes com apenas ícone (`IconButton`) exigem `aria-label` obrigatório via TypeScript — erro de compilação se faltar.
- Estados de erro em formulário usam `aria-invalid` + `aria-describedby` + `role="alert"`, não só cor.
- Motion respeita `prefers-reduced-motion` globalmente.
- Toda primitiva interativa é navegável 100% por teclado (herdado do Radix UI, que implementa os padrões WAI-ARIA Authoring Practices).

---

## 2. Primitivos — Onda 1

### 2.1 Button

**Objetivo:** ação primária de interface. Base de todo CTA do produto.

**Variantes:** `primary` (terracota — uma ação primária por tela) · `secondary` (marrom sólido) · `outline` · `ghost` · `destructive` · `link`

**Tamanhos:** `sm` `md` `lg` `icon`

**Estados:** default, hover, active, focus-visible, disabled, `loading` (spinner substitui espaço do ícone, texto permanece no DOM)

**Acessibilidade:** `asChild` permite compor com `<Link>` do Next.js mantendo semântica de link (não usar `<button onClick={() => router.push()}>` para navegação). `aria-busy` automático quando `loading`.

**Responsividade:** altura fixa por tamanho (não encolhe abaixo de 40px em `md`, evita alvo de toque pequeno em mobile).

**Exemplo:**
```tsx
<Button variant="primary" size="md">Aprovar orçamento</Button>
<Button variant="outline" size="sm" loading={isSaving}>Salvar</Button>
<Button asChild variant="link"><Link href="/clientes/123">Ver cliente</Link></Button>
```

**Boas práticas:** uma única `variant="primary"` visível por tela/seção. Usar `destructive` só para ações irreversíveis (cancelar atendimento, excluir cliente).

**Más práticas:** não empilhar dois botões `primary` lado a lado — isso remove a hierarquia que o usuário depende para decidir rápido. Não usar `variant="link"` dentro de texto corrido (usar `<a>` ou `link-cta` do site para isso).

---

### 2.2 IconButton

**Objetivo:** ação compacta identificada só por ícone (editar, mais opções, fechar).

**Variantes:** `default` `outline` `solid` · **Tamanhos:** `sm` `md` `lg`

**Estados:** iguais ao Button.

**Acessibilidade:** `aria-label` é campo obrigatório no tipo — o componente não compila sem ele. Sempre envolver com `SimpleTooltip` quando a ação não for óbvia pelo contexto (ex: ícone de reticências).

**Exemplo:**
```tsx
<SimpleTooltip label="Editar cliente">
  <IconButton aria-label="Editar cliente" variant="outline"><Pencil /></IconButton>
</SimpleTooltip>
```

**Más práticas:** nunca usar `IconButton` para a ação primária de uma tela inteira (ex: "Criar agendamento") — ali o texto do `Button` importa para reconhecimento, não só o ícone.

---

### 2.3 Badge

**Objetivo:** comunicar status curto (agendamento, plano, categoria) de forma escaneável em listas densas.

**Variantes:** `neutral` `brand` `success` `warning` `danger` `outline` · **Prop `dot`:** adiciona indicador circular

**Acessibilidade:** cor nunca é o único sinal — o texto do badge sempre descreve o estado por extenso (`"Confirmado"`, não só verde). `dot` é puramente decorativo (`aria-hidden`).

**Exemplo:**
```tsx
<Badge variant="warning" dot>Orçamento pendente</Badge>
<Badge variant="success">Confirmado</Badge>
```

**Boas práticas:** mapear o enum de domínio (ex: `AppointmentStatus`) para variante em um único lugar (`lib/status-map.ts`), nunca espalhar `if/else` de cor pela UI.

**Más práticas:** não usar Badge para textos longos ou com quebra de linha — ele é feito para 1-3 palavras.

---

### 2.4 Input / Field

**Objetivo:** entrada de texto de linha única, com padrão consistente de label, erro e ícones.

**Estados:** default, focus (borda terracota + anel), error (borda vermelha + `role="alert"`), disabled

**Acessibilidade:** `Field` associa `label`/`htmlFor` automaticamente; erro é anunciado via `aria-describedby` + `role="alert"`, não depende só da cor vermelha.

**Exemplo:**
```tsx
<Field label="Nome completo" htmlFor="name" required>
  <Input id="name" placeholder="Ex: Ana Paula" />
</Field>
<Input leadingIcon={<Search />} placeholder="Buscar cliente..." />
```

**Más práticas:** não usar `placeholder` como substituto de `label` — placeholder some ao digitar e prejudica quem usa zoom ou tem dificuldade de memória de curto prazo.

---

### 2.5 Textarea

**Objetivo:** entrada de texto multilinha (observações de prontuário, descrição de expectativa no orçamento).

Mesma linguagem visual e regras de acessibilidade do Input. Resize vertical habilitado por padrão (`resize-y`), nunca `resize: none` sem motivo explícito — usuário precisa controlar o próprio espaço de leitura.

---

### 2.6 Tooltip / SimpleTooltip

**Objetivo:** contexto adicional sob demanda, sem poluir a interface permanentemente.

**Acessibilidade:** construído sobre Radix (`@radix-ui/react-tooltip`) — aparece tanto em hover quanto em foco por teclado, com delay configurável (`delayDuration`, default 300ms) para não disparar em passagens acidentais do mouse.

**Más práticas:** nunca colocar dentro do tooltip uma informação que o usuário *precisa* para completar a tarefa (isso deve estar visível por padrão, não escondido atrás de hover — hover não existe em touch).

---

### 2.7 Skeleton

**Objetivo:** estado de carregamento que preserva o layout final, evitando "pulo" de conteúdo (CLS).

**Composições prontas:** `SkeletonTableRow`, `SkeletonCard` — usar essas antes de montar um skeleton customizado para manter consistência.

**Acessibilidade:** `role="status"` + `aria-label="Carregando"` no container, para leitores de tela anunciarem o estado sem precisar descrever cada retângulo cinza individualmente.

---

### 2.8 EmptyState

**Objetivo:** substituir tela em branco por convite à ação — princípio de copy do design system: vazio nunca é passivo.

**Exemplo:**
```tsx
<EmptyState
  icon={<Inbox />}
  title="Nenhum orçamento pendente"
  description="Assim que um cliente enviar fotos pelo WhatsApp, o orçamento aparece aqui."
  action={<Button variant="outline">Criar orçamento manual</Button>}
/>
```

**Más práticas:** não usar EmptyState genérico ("Nada encontrado") — sempre nomear o que especificamente está vazio e, quando fizer sentido, oferecer uma ação que resolve isso.

---

## 3. Roadmap das próximas ondas

Para manter qualidade real em vez de cobertura superficial, o design system é entregue em ondas. Esta é a Onda 1.

| Onda | Conteúdo |
|---|---|
| **2** | Select, Combobox, Checkbox, Radio, Switch, Dropdown, Dialog, Sheet |
| **3** | DatePicker, TimePicker, CurrencyInput, PhoneInput, Tabs, Table, Pagination, Toast, Command Palette |
| **4** | App Shell (Sidebar, Topbar, Breadcrumb, Search Global, Notification Center, User Menu) |
| **5** | Dashboard Grid, Stat Cards, Charts, Filters, Cards, Timeline |

Só depois da Onda 5 concluída entra a Agenda, como você definiu.
