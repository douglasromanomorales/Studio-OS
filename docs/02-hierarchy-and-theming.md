# CodeChain Design System
CodeChain Automações · Documento de hierarquia, theming e roadmap

> Renomeado de "Studio OS Design System" para **CodeChain Design System** (`@codechain/ui`).
> A partir desta revisão, o pacote vive fora do Studio OS e é consumido por ele como
> dependência — não o contrário. Qualquer produto futuro (Sofia IA, CRM, ERP, Portal)
> consome o mesmo pacote e injeta seu próprio tema.

---

## 1. Por que isso mudou de arquitetura, não só de nome

Renomear o documento sem mudar o código teria sido cosmético. O problema real: os 8
primitivos da Onda 1 tinham `--color-terracotta`, `--color-brown` etc. como **tokens do
próprio sistema**. Isso significa que todo componente carregava a marca da Casa Nataly
embutida — funcionava com um único cliente, quebraria no segundo.

**Correção estrutural, feita agora:**

```
src/tokens/tokens.css     → vocabulário semântico (--brand, --surface, --text-primary...)
                              NUNCA contém hex. Isso é o CodeChain Design System.

themes/casa-nataly.css    → mapeia o vocabulário para os hex reais da marca
                              (#B85A3D, Playfair Display, Inter...)
                              Isso é o Studio OS aplicado à Casa Nataly.
```

Um componente como `<Button variant="primary">` nunca sabe que existe terracota. Ele lê
`var(--brand)`. Trocar de tenant, ou usar o mesmo `Button` na Sofia IA, é trocar qual
arquivo de tema está ativo (`data-theme="casa-nataly"` no `<html>` ou `<body>`) — zero
mudança em componente.

Isso é o mesmo padrão que Stripe, Vercel e a própria Anthropic usam internamente (camada
de paleta → camada de tema → camada de propósito). Não é over-engineering: é a diferença
entre "componentes com a cor da Nataly" e um design system de verdade.

---

## 2. Hierarquia oficial

```
FOUNDATION   → princípios (cor, tipo, espaço, motion, a11y) — não é código, é decisão
     ↓
TOKENS       → tokens.css (semântico) + themes/*.css (valores por marca)
     ↓
PRIMITIVES   → Button, Input, Badge, Card... — sem noção de domínio
     ↓
COMPOSITES   → Dialog, Sheet, Dropdown, Command Palette... — primitivos combinados,
                ainda sem domínio (um Dialog não sabe que existe "agendamento")
     ↓
PATTERNS     → composições com alguma consciência de domínio, mas reutilizáveis entre
                módulos (ex: StatusBadge que mapeia enum→Badge, FormSection)
     ↓
TEMPLATES    → layouts de página completos, com áreas nomeadas mas sem dado real
                (ex: DetailPageTemplate: header + tabs + sidebar de metadados)
     ↓
PAGES        → a tela real, com dado real, dentro de um módulo (ex: /clientes/[id])
```

**Exemplo aplicado ao domínio real** (como você pediu):

```
Button                          → PRIMITIVE (CodeChain Design System)
  ↓
AppointmentStatusBadge          → PATTERN  (mapeia AppointmentStatus → <Badge variant>)
  ↓
AppointmentCard                 → PATTERN  (Card + AppointmentStatusBadge + Avatar + horário)
  ↓
AppointmentTimeline             → COMPOSITE de domínio (lista vertical de AppointmentCard)
  ↓
Agenda                          → TEMPLATE + PAGE (módulo funcional, item 13 do roadmap)
  ↓
Dashboard                       → PAGE (compõe StatCards, AppointmentTimeline, InsightFeed)
```

Isso também responde à pergunta "esse componente serve para 20 telas?": qualquer coisa
até a camada **Pattern** deve responder sim. A partir de **Template**, é esperado que sirva
só para um módulo — e tudo bem, porque a reutilização já aconteceu nas camadas de baixo.

---

## 3. Consultas vs. Orçamentos — implicação no modelo de dados

Vocês separaram oficialmente o que antes era um único fluxo. Isso muda o schema Prisma
construído na fase de arquitetura (ainda não codificado nesta rodada — só registrado aqui
para não se perder, já que o roadmap coloca Consultas e Orçamentos nos itens 11 e 12,
depois de Serviços/Bundles):

- **Consulta** — entidade de intake: fotos, histórico químico, objetivo da cliente. Nasce
  do primeiro contato (Instagram/WhatsApp), sem preço envolvido ainda.
- **Orçamento** — entidade de precificação: referencia uma `Consulta`, carrega a avaliação
  da profissional, o valor proposto e o status de aprovação. Só depois de aprovado gera um
  `Appointment`.

Isso substitui o `AppointmentStatus.PENDING_QUOTE` que eu tinha modelado antes — aquele
campo confundia duas responsabilidades (intake + precificação) dentro do próprio
Appointment. Vou remodelar isso quando chegarmos no item 11/12 do roadmap, não agora.

---

## 4. Refinamentos visuais aplicados nesta rodada

| Componente | Antes | Depois |
|---|---|---|
| **Card** | não existia como primitivo isolado | novo: borda 1px quase imperceptível (`--border`), sombra `--shadow-xs`, radius `--radius-md` — referência Stripe Dashboard |
| **Input/Textarea** | `h-10`, `px-3.5` | `h-11`, `px-4` — folga adicional que muda a sensação de "genérico" para "premium" |
| **Badge** | cor estática | transição suave (`--dur-base`) entre variantes + `pulse` opcional para status que pedem atenção ativa |
| **Button** | regra implícita | regra de um `primary` por tela agora documentada no próprio JSDoc do componente, não só na doc externa |
| **EmptyState** | ícone + texto centralizado | removido qualquer sugestão de moldura/tracejado; espaçamento vertical maior (`py-20`); variante `compact` para uso dentro de cards |

---

## 5. Roadmap oficial (substitui o anterior)

```
1  Foundations         ✅ concluído
2  Primitives          🔶 em andamento — Onda 1 (8) + refinamentos ✅ · restam Checkbox,
                        Radio, Switch, Avatar, Divider, Spinner (próxima onda, abaixo)
3  Forms               Select, Combobox, DatePicker, TimePicker, CurrencyInput, PhoneInput
4  Navigation          Tabs, Breadcrumb, Dropdown, Pagination, Command Palette
5  App Shell           Sidebar, Topbar, UserMenu, WorkspaceSwitcher, Search Global,
                        Notification Center, Toast System, Theme Engine, Focus Management
6  Dashboard
7  Clientes
8  Profissionais
9  Serviços
10 Bundles
11 Consultas
12 Orçamentos
13 Agenda
14 Financeiro
15 Estoque
16 Portal
17 IA
18 Marketing
```

---

## 5.1 ADR — Topologia de pacotes da plataforma

**Contexto:** a Decisão 5 propôs dividir a plataforma em 10 pacotes npm
(`ui`, `forms`, `auth`, `core`, `charts`, `notifications`, `storage`, `ai`, `whatsapp`,
`analytics`) desde já.

**Problema:** `forms` nunca é consumido sem `ui` (todo formulário usa `Button`/`Input`
junto) — não é um limite real de pacote, é fricção de import. `core` é um nome que vira
gaveta de miscelânea sem definição de conteúdo. `notifications` é ambíguo entre Toast
de UI (já em `ui`) e serviço de notificação multi-canal (backend). Os demais
(`auth`, `storage`, `ai`, `whatsapp`, `analytics`) são SDKs de integração de backend,
categoria arquitetural diferente de design system — empacotá-los agora, sem conteúdo
real, é publicar superfície de API antes de saber o que ela precisa expor.

**Decisão:**
- `@codechain/ui` absorve Forms e Notifications (Toast) — permanecem camadas dentro do
  mesmo pacote (`primitives/`, `composites/`), não pacotes separados.
- `auth`, `core`, `charts`, `storage`, `ai`, `whatsapp`, `analytics` ficam **adiados**
  até o primeiro consumidor real. Cada um nasce com nome preciso do que faz no momento
  em que nasce (ex: validadores de documento brasileiro não vira `core`, vira
  `@codechain/br-validators`).
- Critério de corte para "quando vira pacote próprio": quando (a) existe um segundo
  produto consumindo, ou (b) o conteúdo tem ciclo de release genuinamente independente
  do resto (ex: um SDK de IA que versiona por modelo, não por sprint de produto).

**Status:** adotada. Reversível mediante nova ADR se um pacote adiado ganhar
consumidor real antes do previsto.

---

## 6. Próxima onda — justificativa (Primitives, parte 2)

**Por que existe:** fecha a camada de Primitives antes de subir para Forms. `Checkbox`,
`Radio` e `Switch` são os três controles binários/múltipla-escolha que faltam — sem eles,
nenhum formulário real (Forms, onda 3) pode ser construído. `Avatar` é necessário para
qualquer lista de pessoas (clientes, profissionais) e para o `UserMenu` do App Shell.
`Divider` e `Spinner` são utilitários de baixíssimo nível que outras 15+ telas vão pedir.

**Qual problema resolve:** hoje não há como construir um formulário de preferências, um
toggle de configuração, ou uma lista de profissionais com foto — tudo trava nisso.

**Quem depende:** Forms (onda 3) depende de Checkbox/Radio/Switch. App Shell (onda 5)
depende de Avatar para UserMenu e para itens de notificação. Praticamente todo módulo de
listagem (Clientes, Profissionais, item 7-8) depende de Avatar.

**Quem se beneficia no futuro:** Consultas e Orçamentos (11-12) vão usar Switch para
"precisa de teste de mechas?", Checkbox para seleção múltipla de serviços em um bundle,
Avatar em toda exibição de cliente/profissional no sistema inteiro.
