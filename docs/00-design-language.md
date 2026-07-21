# CodeChain Design Language
O manifesto de design da CodeChain Automações

> Este documento não é um manual de componentes. É o motivo pelo qual os componentes
> existem do jeito que existem. Se um dia um componente entrar em conflito com este
> documento, o componente está errado — não o contrário.
>
> Qualquer pessoa que entrar na CodeChain — design ou engenharia — deve conseguir ler
> isto em uma tarde e entender como pensamos produto, sem precisar perguntar "por que
> fizemos assim" em toda reunião.

---

## 0. Por que este documento existe

Software de gestão para o setor de beleza no Brasil, até hoje, parece software de
gestão. Telas cinzas, densas, funcionais no sentido mais frio da palavra — resolvem o
problema e não comunicam mais nada além disso. Isso não é neutro: comunica que o
software é uma obrigação, não uma ferramenta da qual a pessoa sente orgulho de usar na
frente da cliente dela.

A CodeChain aposta no oposto. Construímos software que uma gestora de salão *mostra*
para outra gestora. Isso não é sobre deixar bonito por cima — é sobre a crença de que
clareza, ritmo e cuidado visual são, eles mesmos, uma forma de respeito pelo tempo de
quem usa. Uma profissional de estética que passa 8 horas por dia dentro do Studio OS
merece a mesma qualidade de interface que um engenheiro usando o Linear ou um
financista usando o Stripe Dashboard. Não é um luxo — é o piso.

Esse compromisso só é sustentável se ele existir **de propósito**, em um sistema, não
como talento individual de quem construiu a primeira tela. É para isso que serve o
CodeChain Design System — e é para isso que serve este documento: garantir que a
próxima pessoa a abrir o editor, daqui a dois anos, construindo um produto que ainda
nem existe, chegue à mesma decisão que chegaríamos hoje.

---

## 1. Filosofia

### 1.1 Software é a promessa de um resultado, não uma lista de tarefas

Nenhum produto da CodeChain deve parecer que existe para "processar dados". Existe para
que uma pessoa alcance um resultado — fechar a agenda do dia sem susto, aprovar um
orçamento em 30 segundos, saber com um olhar se o mês está indo bem. A interface é o
caminho até esse resultado, e todo elemento que não encurta esse caminho é ruído.

### 1.2 Restrição é a decisão mais difícil e a mais valiosa

É fácil adicionar um badge, uma cor, uma animação, um botão a mais. É difícil decidir
que algo não vai existir. Um produto CodeChain tem, de propósito, menos elementos
visuais do que poderia ter — a mesma disciplina que faz o Linear parecer rápido mesmo
quando não está fazendo nada de tecnicamente extraordinário.

### 1.3 Um produto, uma marca por trás — sistema, não coincidência

Todo produto da CodeChain nasce sobre o mesmo alicerce (`@codechain/ui`). Isso não é
economia de esforço — é a garantia de que uma pessoa que aprendeu a usar o Studio OS
já sabe 80% de como usar a Sofia IA. Consistência entre produtos é uma feature do
portfólio, não um acidente de reaproveitamento de código.

### 1.4 Elegância editorial, não decoração de app

A referência visual da CodeChain não é "aplicativo bonito" — é publicação editorial de
alto padrão (o mesmo instinto por trás do site da Casa Nataly) encontrando disciplina
de software de produtividade (Stripe, Linear, Notion, Raycast, Vercel). Tipografia
serifada com peso emocional nos lugares certos; tudo o resto é utilitário, rápido,
sóbrio. Nunca as duas linguagens brigando na mesma tela.

### 1.5 O sistema é a plataforma, não o produto

A partir desta decisão, o CodeChain Design System deixa de servir "o Studio OS com
componentes reutilizáveis" e passa a ser a plataforma sobre a qual **todo** produto da
empresa nasce. Isso muda o critério de aceitação de qualquer componente novo: a
pergunta não é "isso resolve a tela que estou construindo", é "isso resolve a tela que
estou construindo **sem hipotecar a próxima**".

---

## 2. Princípios — as regras que não se negociam

1. **Um accent por tela.** Um `<Button variant="primary">` visível por vez. A cor de
   marca (`--brand`) é um recurso escasso — se tudo grita, nada é ouvido.
2. **Toda cor tem significado, nunca decoração.** Se um elemento é terracota, é porque
   é a ação principal ou porque representa a marca — nunca "porque ficou bonito".
3. **Vazio é convite, nunca pedido de desculpas.** Um EmptyState nomeia o que falta e
   oferece o próximo passo. "Nada encontrado" é proibido.
4. **Feedback em até 100ms, resultado visível em até 250ms.** Se uma ação do produto
   demora mais que isso, ela precisa de um estado de carregamento explícito — nunca
   uma tela congelada sem explicação.
5. **Teclado primeiro, mouse depois.** Todo fluxo crítico do painel (aprovar
   orçamento, confirmar agendamento) deve ser completável sem tocar no mouse.
6. **Nada se move sem motivo.** Animação existe para explicar uma mudança de estado
   (isso apareceu, isso sumiu, isso virou aquilo) — nunca para "dar vida" à tela.
7. **A marca vive no tema, nunca no componente.** Um primitivo nunca contém hex,
   nome de fonte ou qualquer decisão que pertença a um tenant específico.
8. **Densidade é uma escolha consciente, não um acidente de CSS apertado.** Telas de
   uso profissional intenso (Agenda, Fila de Orçamentos) podem ser mais densas que
   telas de uso ocasional (Configurações) — de propósito, documentado, não porque
   "coube mais assim".
9. **O sistema aprende com o produto, o produto não força o sistema.** Quando um
   padrão se repete em 3+ telas de produtos diferentes, ele sobe de Pattern para
   Composite ou Primitive. Até lá, fica no produto.

---

## 3. Hierarquia (recapitulação normativa)

```
FOUNDATION → TOKENS → PRIMITIVES → COMPOSITES → PATTERNS → TEMPLATES → PAGES
```

Regra de governança: **uma mudança em uma camada nunca pode exigir mudança na camada
acima dela conhecer a de baixo.** Um Pattern pode conhecer um Composite; um Primitive
nunca pode conhecer um Pattern. Isso é o que permite que o sistema cresça sem virar
espaguete de dependências cruzadas. Ver `docs/02-hierarchy-and-theming.md` para a
tabela completa com exemplos de código.

---

## 4. Tipografia

**Papel, não fonte.** O sistema define `--font-display` e `--font-body` como papéis;
cada tema decide a fonte real. Isso significa que a regra "serifado para peso
emocional, sans para funcional" é uma regra da CodeChain, não da Casa Nataly.

| Regra | Motivo |
|---|---|
| Display só em títulos, nomes de destaque e valores que merecem peso emocional | Se aparecer em botão, tabela ou navegação, perde a força de ser "o momento especial" da tela |
| Nunca dois pesos de display na mesma composição | Hierarquia se constrói com tamanho e itálico, não empilhando pesos |
| Corpo de texto nunca abaixo de 13px no produto | Abaixo disso, deixa de ser legível confortavelmente em uso prolongado (8h/dia) |
| Letter-spacing amplo (`.14em`+) é reservado a labels uppercase curtos | Em texto corrido isso prejudica leitura — é recurso de rótulo, não de parágrafo |

---

## 5. Espaçamento

Escala 4px (`4·8·12·16·20·24·32·40·48·64`). Regra de ouro: **espaçamento entre grupos
não relacionados é sempre maior que espaçamento dentro de um grupo relacionado.** Se
dois elementos têm o mesmo espaçamento visual, o usuário deveria poder assumir que eles
pertencem ao mesmo grupo semântico — se isso não for verdade, o espaçamento está
mentindo para o usuário.

---

## 6. Grid

- **Produto** (painel/app): `--app-max-width: 1440px`, sidebar fixa, conteúdo fluido.
  Otimizado para telas de trabalho (desktop/notebook), com fallback responsivo — nunca
  o inverso (não desenhamos mobile-first para uma ferramenta de gestão usada no balcão
  do salão, num desktop ou tablet fixo).
- **Marketing/Portal**: container 1240px, mobile-first de verdade — aqui sim a maioria
  do tráfego é celular, cliente final buscando um horário.

Essa assimetria é intencional e deve ser reavaliada por produto: a Sofia IA, por
exemplo, pode inverter essa prioridade se for majoritariamente usada via WhatsApp/
mobile.

### 6.1 Mobile Capable ≠ Mobile First

O painel administrativo é desktop-first, mas todo módulo é **obrigatoriamente Mobile
Capable**: não precisa de produtividade máxima no celular, mas as operações rápidas de
um dia de trabalho — confirmar agendamento, responder orçamento, cancelar atendimento,
consultar agenda, ver indicadores — precisam funcionar corretamente em qualquer
tamanho de tela. Na prática: nenhum componente do sistema pode assumir largura mínima
de desktop para ser operável; ele pode assumir densidade menor, colunas que empilham,
mas nunca uma ação impossível de completar em mobile.

---

## 7. Motion

Duas famílias, nunca misturadas dentro do mesmo contexto de uso:

| | Produto | Marca/Storytelling |
|---|---|---|
| Timing | 100–250ms | 500ms–1.6s |
| Easing | `--ease-product` (linear-ish, previsível) | `--ease-cinematic` (overshoot suave) |
| Função | Confirmar que uma ação aconteceu | Criar uma emoção, contar uma história |
| Onde | Painel administrativo, Portal logado em tarefa | Landing, onboarding, primeira impressão |

Regra prática: se a pessoa está tentando **terminar uma tarefa**, motion é produto. Se
a pessoa está **decidindo se confia na marca**, motion é cinematográfico. Nunca os dois
ao mesmo tempo na mesma tela.

---

## 8. Acessibilidade

Acessibilidade não é uma auditoria que se faz no fim. É uma restrição de design que
entra antes da primeira linha de CSS — da mesma forma que "tem que rodar em produção"
é uma restrição de engenharia que ninguém discute.

- Contraste AA como piso, nunca como meta.
- Todo estado de erro é anunciado por texto, nunca só por cor.
- Todo fluxo crítico funciona 100% por teclado.
- `prefers-reduced-motion` é respeitado globalmente, não op-in por componente.
- Um componente com só ícone exige label — isso é forçado pelo tipo, não pela
  disciplina de quem está codando naquele dia.

---

## 9. Cor e tema

Já formalizado na decisão anterior: **tokens semânticos no sistema, valores de marca
no tema.** A regra de linguagem que vem daí: quando alguém pedir "adiciona essa cor
aqui", a primeira pergunta é *"essa cor representa um novo papel semântico, ou é só o
`--brand` de um tema que ainda não existe?"* — quase sempre é a segunda, e a resposta
certa é criar/ajustar um tema, não um token novo.

---

## 10. Linguagem e voz do produto

O produto fala em primeira pessoa do plural implícita ("sua agenda", nunca "minha
agenda") e nunca finge ser uma pessoa. A voz é **direta, competente, sem gentileza
artificial** — a mesma voz que uma boa gestora usaria com a equipe: clara, sem
enrolação, sem desculpas desnecessárias.

| Regra | Errado | Certo |
|---|---|---|
| Verbo no imperativo em botão, nunca substantivo | "Confirmação" | "Confirmar agendamento" |
| Nunca "sucesso" redundante — o próprio feedback já é a confirmação | "Salvo com sucesso!" | "Salvo" |
| Sem ponto de exclamação em copy de sistema | "Agendamento criado!" | "Agendamento criado" |
| Erros dizem o que aconteceu e o que fazer, nunca were expõem stack trace | "Error: undefined" | "Não foi possível salvar. Verifique a conexão e tente de novo." |
| EmptyState nomeia o vazio específico, nunca genérico | "Nada encontrado" | "Nenhum orçamento pendente" |
| "Você"/"sua" para o que pertence à pessoa, nunca "eu" fora do contexto de IA | "Meus clientes" | "Seus clientes" |
| Só a Sofia IA (assistente) fala em primeira pessoa | — | "Encontrei 3 horários livres essa semana" |

---

## 11. Estados

Todo componente interativo do sistema é obrigado a contemplar, quando aplicável:

`default → hover → focus-visible → active → disabled` e, quando envolve dado
assíncrono: `loading (skeleton) → populated → error → empty`.

Nenhum componente novo entra no sistema sem que os estados relevantes estejam
documentados e implementados — um `Button` sem estado `loading` documentado é
considerado incompleto, não "versão inicial que dá pra evoluir depois".

---

## 12. Nomenclatura

Nome é arquitetura — um nome errado hoje é uma migração cara amanhã.

- **Componentes**: `PascalCase`, substantivo, nunca verbo (`AppointmentCard`, não
  `ShowAppointment`).
- **Props booleanas**: sempre em forma de pergunta afirmativa (`loading`, `disabled`,
  `interactive` — nunca `isLoading` misturado com `disabled` sem `is`; escolhemos
  **sem prefixo `is/has`** em todo o sistema, por consistência).
- **Tokens CSS**: `--camada-papel[-variante]` (`--surface-card`, `--text-secondary`,
  `--brand-hover`). Nunca o valor no nome (`--color-orange` é proibido — o papel é o
  que importa, não o pigmento).
- **Arquivos**: `kebab-case.tsx`, um componente principal por arquivo, composições
  auxiliares (ex: `Field`, `CheckboxField`) podem coexistir no mesmo arquivo do
  primitivo que elas envolvem.
- **Patterns de domínio**: `{Entidade}{Papel}` (`AppointmentStatusBadge`,
  `CustomerAvatar`) — nunca o inverso, para que buscar por entidade agrupe tudo
  relacionado a ela no autocomplete do editor.
- **Módulos internos**: arquivo prefixado com `_` (`_combobox-shell.tsx`,
  `_calendar-engine.tsx`) nunca é exportado pelo `package.json` do `@codechain/ui` —
  existe só para eliminar duplicação real entre dois ou mais componentes públicos.
  Regra de criação: construir os componentes públicos primeiro, perceber a
  duplicação, **então** extrair o `_` — nunca o contrário. A API pública do sistema
  deve permanecer pequena; a implementação interna pode crescer livremente por baixo
  dela. Essa é a característica que separa uma plataforma madura de uma coleção de
  componentes: poucas portas de entrada, muita reutilização escondida atrás delas.

---

## 13. Semântica dos componentes

Cor, ícone e posição carregam significado fixo em todo o sistema — uma vez definidos,
não são reinterpretados por tela:

- **Terracota/brand** = ação primária ou identidade de marca. Nunca "destaque
  genérico".
- **Verde (success)** = confirmado, concluído, positivo financeiramente. Nunca usado
  para "novidade" ou "recomendado".
- **Âmbar (warning)** = requer atenção, mas não é erro — orçamento pendente, estoque
  baixo. É o estado mais importante do vocabulário do Studio OS, porque é onde a fila
  de orçamentos vive.
- **Vermelho (danger)** = irreversível ou já é um problema — cancelamento, erro,
  crédito estourado.
- **Badge com `dot` pulsante** = requer ação humana ativa, não é só um status
  informativo. Uso raro, de propósito — se tudo pulsa, nada chama atenção.
- **Ícone à esquerda de texto** = a ação é sobre o item. **Ícone à direita** = a ação
  navega para outro lugar (padrão "seta para a direita" indica saída da tela atual).

---

## 14. Princípios de UX

1. **Otimize para a segunda vez que a pessoa usa, não para a primeira.** A gestora vai
   abrir a Agenda 300 vezes por mês — micro-atrito ali custa mais que em uma tela de
   onboarding vista uma única vez.
2. **Nenhum fluxo termina em beco sem saída.** Toda tela final de um fluxo (orçamento
   aprovado, agendamento confirmado) oferece o próximo passo óbvio, não só uma
   confirmação passiva.
3. **Erros de negócio são educação, não bloqueio seco.** Se o sistema impede uma ação
   (ex: agendar Botox sem profissional credenciada), a mensagem explica a regra, não
   só nega.
4. **Densidade de informação escala com expertise do usuário.** Painel administrativo
   pode (e deve) mostrar mais dado por tela do que o Portal do Cliente, que atende
   alguém que usa o produto uma vez a cada duas semanas.
5. **Nunca fazer a pessoa lembrar o que o sistema já sabe.** Se o cliente já mandou
   foto e histórico na Consulta, o Orçamento não pergunta de novo.

---

## 15. Princípios de Product Design

1. **Toda funcionalidade nova precisa responder: qual gargalo real ela resolve?** —
   não "seria legal ter". O módulo de Consultas existe porque um gargalo operacional
   real foi mapeado, não porque parecia sofisticado.
2. **Construir para o produto, validar com o cliente-piloto.** A Casa Nataly valida
   que a solução funciona no mundo real; ela não dita a arquitetura.
3. **Reversibilidade antes de confirmação dupla.** Preferimos permitir desfazer uma
   ação a interromper o fluxo com "tem certeza?" — modais de confirmação são o último
   recurso, não o primeiro.
4. **Todo módulo novo herda o sistema, nunca cria exceção visual.** Se um módulo
   "precisa" de um componente fora do padrão, isso é sinal de que falta um Composite
   ou Pattern no sistema — não licença para inventar localmente.
5. **Qualidade é o funil, não a régua no final.** Um componente abaixo do nível
   Stripe/Linear/Vercel/Raycast não "passa por enquanto" — para, revisa, melhora antes
   de seguir. Isso já está em prática nesta conversa e é o padrão daqui em diante.

---

## 16. Governança deste documento

Este manifesto muda por decisão deliberada, nunca por deriva silenciosa de um
componente isolado. Qualquer alteração de princípio (seções 1, 2, 14, 15) exige
registro explícito de motivo — igual às ADRs do documento de arquitetura. Alterações de
referência técnica (tipografia, espaçamento, tokens) são atualizadas junto com o código
que as implementa, nunca depois.

---

## 17. Performance

Performance não é uma seção de engenharia solta no fim do projeto — é UX. Uma tela que
demora 400ms a mais para responder é, para quem usa, indistinguível de uma tela mal
desenhada. Ninguém elogia "que rápido", mas todo mundo sente quando não é.

### 17.1 Percepção de velocidade > velocidade real

O cérebro humano não mede milissegundos, mede continuidade. Um skeleton que aparece
instantaneamente e populamos em 400ms é percebido como mais rápido que um spinner que
só aparece depois de 200ms de tela em branco e resolve em 300ms — mesmo sendo,
objetivamente, mais lento. Regra: **nunca tela em branco**. Sempre algo no primeiro
frame (skeleton, layout de página, shell).

### 17.2 Server Components por padrão, Client Components por exceção

Todo componente nasce Server Component. Ele só vira Client Component quando precisa de
uma das três coisas que só existem no cliente: interatividade com estado local
(`useState`), efeitos do navegador (`useEffect`, listeners), ou APIs de browser
(`localStorage`, geolocalização). Se um componente só busca dado e renderiza, ele nunca
deveria carregar JavaScript para o navegador — isso é peso que o usuário paga sem
benefício.

### 17.3 Suspense e Streaming

Toda página que combina dado rápido (layout, navegação) com dado lento (uma consulta
pesada de relatório, por exemplo) usa `<Suspense>` para que o rápido apareça
imediatamente e o lento apareça quando estiver pronto — nunca um `await` bloqueante no
topo da árvore que atrasa a página inteira por causa da parte mais lenta dela.

### 17.4 Lazy loading e prefetch

Rotas e componentes pesados (ex: um editor de imagem no prontuário, um gráfico
complexo) carregam sob demanda. Links de navegação usam prefetch no hover/foco sempre
que o destino for previsível — a Agenda, por exemplo, deveria começar a carregar antes
mesmo do clique, no instante em que o cursor passa sobre o item do menu.

### 17.5 Optimistic UI

Ações reversíveis e de alta frequência (marcar orçamento como aprovado, mover um
agendamento no drag-and-drop) atualizam a interface **antes** da confirmação do
servidor, com rollback silencioso em caso de erro. Ações irreversíveis ou financeiras
(registrar um pagamento) esperam confirmação real — optimistic UI é uma ferramenta de
percepção, não uma desculpa para esconder falhas de operações que importam.

### 17.6 Virtualização

Qualquer lista ou tabela que pode ultrapassar ~100 itens visíveis (histórico de
atendimentos, lista de clientes de um salão grande) é virtualizada — o DOM nunca
contém mais nós do que cabem na tela mais uma margem pequena de scroll.

### 17.7 Cache

Dado que muda pouco (catálogo de serviços, configurações da organização) é cacheado
agressivamente com invalidação explícita no momento da escrita — nunca "revalida a
cada request" para dado que só uma pessoa, raramente, altera.

### 17.8 Skeletons em vez de spinners

Já formalizado no primitivo `Skeleton`: sempre que o layout final é previsível
(sabemos que ali vai ter um card com título e valor), o carregamento mostra a forma do
resultado final, não um símbolo genérico de "espera". Spinner é reservado para ações
pontuais sem layout final óbvio (ex: um botão processando um clique).

### 17.9 Tempo de interação e performance budget

- **Time to Interactive** da Agenda e do Dashboard (as duas telas de maior uso diário):
  meta de até 2s em conexão 4G típica.
- **Resposta a interação** (clique, digitação): feedback visual em até 100ms — mesmo
  que a operação completa demore mais, o *reconhecimento* da ação precisa ser
  instantâneo.
- Qualquer PR que aumentar o bundle de uma rota em mais de 15% precisa justificar o
  motivo — o budget não é decorativo, é revisado no code review.

### 17.10 Core Web Vitals como piso, não meta aspiracional

LCP < 2.5s, INP < 200ms, CLS < 0.1 são requisitos de aceite do Portal do Cliente (onde
performance de rede real do usuário importa mais que no painel administrativo, que
roda em desktop de trabalho com internet estável).

### 17.11 Evitar re-renderizações desnecessárias

Estado local fica o mais próximo possível de onde é usado — nunca subir estado para um
componente pai só porque "pode ser útil depois". Context é para dado genuinamente
global (tema, sessão do usuário) — nunca para passar props por atalho entre
componentes que poderiam simplesmente receber a prop diretamente.

### 17.12 Escalabilidade

O mesmo componente que funciona com os dados da Casa Nataly (uma organização, uma
dúzia de profissionais) precisa continuar performático com centenas de organizações no
SaaS multi-tenant — isso significa: toda query tem paginação desde o dia 1, mesmo
quando a lista atual cabe inteira numa tela. Adicionar paginação depois, quando um
tenant grande sentir a dor, é a definição de dívida técnica evitável.

---

## 18. Observabilidade

Todo produto da CodeChain nasce observável — não porque "vamos precisar depurar
problema um dia", mas porque decisão de produto sem dado é opinião disfarçada de
estratégia.

### 18.1 Logs estruturados

Logs são JSON, nunca string livre — `{ level, event, organizationId, userId, ...contexto }`,
nunca `console.log("deu erro aqui")`. Um log que não pode virar uma query em segundos
de incidente é um log que não ajudou.

### 18.2 Auditoria

Toda mutação em dado sensível (financeiro, prontuário, permissões) grava quem, o quê,
quando e o valor anterior — já formalizado no modelo `AuditLog` da arquitetura do
Studio OS. Isso não é feature de compliance encostada depois: é campo obrigatório do
schema desde a primeira migration da tabela.

### 18.3 Eventos de produto

Toda ação que representa uma decisão de negócio (orçamento aprovado, agendamento
criado, cliente reativado por campanha) emite um evento nomeado de forma consistente
(`orcamento.aprovado`, não `approve_budget` num lugar e `budgetApproved` em outro) —
sem isso, nenhuma métrica de produto (taxa de conversão de orçamento, por exemplo) é
sequer calculável depois.

### 18.4 Analytics e telemetria

Separar sempre **analytics de produto** (o que as pessoas fazem no produto, para
decisão de roadmap) de **telemetria de sistema** (latência, erro, saúde de infra, para
decisão de engenharia). Misturar as duas em uma ferramenta só produz dashboards que
ninguém lê porque servem a duas audiências com necessidades diferentes.

### 18.5 Error tracking

Todo erro não tratado chega a uma ferramenta de rastreamento com contexto completo
(usuário, organização, rota, stack) — nunca só aparece no console do navegador da
pessoa que teve o problema e nunca mais é visto por ninguém da equipe.

### 18.6 Performance monitoring

As métricas da seção 17 (Core Web Vitals, tempo de interação) são monitoradas em
produção, não só medidas uma vez em desenvolvimento — performance regride
silenciosamente se ninguém está olhando continuamente.

### 18.7 Feature flags

Todo módulo novo (Consultas, IA, Marketing) nasce atrás de uma flag, ativável por
organização — isso permite validar com a Casa Nataly antes de expor a todo o SaaS, e
permite desligar rápido se algo quebrar em produção sem precisar de deploy de
emergência.

### 18.8 Health checks e alertas

Todo serviço externo do qual o produto depende (WhatsApp provider, storage, IA) tem
verificação de saúde própria — se a Evolution API cair, o sistema precisa saber (e
avisar a equipe) antes que a Nataly descubra porque um cliente reclamou que não recebeu
lembrete.

### 18.9 Métricas que importam

O objetivo final da observabilidade não é ter dashboards bonitos — é permitir perguntas
como "quantos orçamentos ficam pendentes por mais de 24h?" ou "qual módulo mais gera
erro no celular?" e ter resposta em minutos, não em uma investigação manual de uma
tarde.

---

## 19. Headless First

Todo componente complexo do CodeChain Design System nasce em duas camadas
separadas — prática consolidada por Radix, React Aria e TanStack, e adotada aqui como
princípio oficial:

```
ENGINE (headless)  →  comportamento puro: estado, cálculo, teclado, a11y.
                       Nunca decide como algo se parece.
      ↓
UI (componente público)  →  decide aparência e composição visual.
                             Consome a engine, nunca reimplementa a lógica dela.
```

### 19.1 O que qualifica como Engine

Já formalizado no princípio anterior: uma engine encapsula **comportamento
reutilizável**, nunca **agrupamento visual**. O teste prático continua sendo as 5
perguntas (existe duplicação real / comportamento compartilhado / motor já existente /
é componente novo / é só composição) — Headless First é a resposta arquitetural
quando a resposta é "sim, existe comportamento compartilhado real".

### 19.2 Uma engine serve múltiplas camadas da hierarquia, não só uma

Esta é a extensão importante desta diretriz: uma engine não pertence a um único
Primitive — ela pode alimentar componentes em qualquer camada da hierarquia
(seção 3), da mesma forma que `_calendar-engine.tsx` já alimenta `DatePicker` e
`DateRangePicker` (Primitives) e vai alimentar, no futuro, camadas muito acima:

```
_calendar-engine
      ↓
DatePicker              (Primitive)
      ↓
MiniCalendar            (Composite — calendário compacto para popover/sidebar)
      ↓
Agenda                  (Template — o módulo funcional mais complexo do Studio OS)
      ↓
BookingCalendar         (Pattern de domínio — calendário de autoagendamento no Portal)
      ↓
AvailabilityCalendar    (Pattern de domínio — visualização de disponibilidade por profissional)
```

Todos os cinco acima compartilham a mesma engine de grade de calendário. Nenhum
reimplementa navegação de mês, geração de dias ou teclado — cada um só decide *o que
significa* selecionar uma célula e *como* ela aparece naquele contexto.

Isso vale para toda engine futura da plataforma: `_upload-engine` alimentará
`FileUpload`, `ImageUpload`, `Dropzone` e, mais tarde, o uploader de fotos do
Prontuário (antes/depois). `_table-engine` alimentará qualquer tabela do sistema, da
lista de clientes ao relatório financeiro. `_command-shell` (a base do
`_combobox-shell` de hoje) alimentará o Command Palette do App Shell.

### 19.3 Regra de dependência

Engines nunca importam de componentes públicos — a direção da dependência é sempre
Engine → UI, nunca o inverso. Uma engine não sabe que `DatePicker` existe; `DatePicker`
sabe que `_calendar-engine` existe. Isso é o que permite uma engine servir Primitives
e Templates ao mesmo tempo sem criar dependência circular entre camadas que, pela
seção 3, nunca deveriam se conhecer na direção inversa.

---

## 20. Classificação de Maturidade

Nenhum componente é estável só por existir com documentação e testes — precisa ter
sobrevivido a uso real. Todo componente público do `@codechain/ui` carrega uma de
quatro classificações, visível na documentação e no Storybook:

```
Experimental → Preview → Stable → Deprecated
```

- **Experimental** — existe como código, ainda não foi usado por nenhum módulo real.
  Pode mudar de API sem aviso.
- **Preview** — já foi revisado (API Review, a11y, teclado), mas ainda não passou pelo
  ciclo completo `Desenvolvimento → Uso real → Relatório → Refatoração → Aprovação →
  Plataforma`. API considerada estável o suficiente para uso, mas sujeita a ajuste se o
  uso real revelar problema.
- **Stable** — completou o ciclo inteiro: foi usado em pelo menos um módulo vertical
  real, gerou relatório de validação, e as correções encontradas já foram aplicadas.
  Mudança de API exige depreciação formal, nunca alteração silenciosa.
- **Deprecated** — mantido por compatibilidade, com data de remoção definida e
  substituto indicado. Novo código nunca deveria importar um componente `Deprecated`.

A promoção de **Preview** para **Stable** só acontece depois de um relatório de
validação como o que o módulo Consultas gerou — não é uma decisão de calendário
("já faz 2 semanas, deve estar maduro"), é uma decisão de evidência de uso.

---

## 21. Regra de dependência entre níveis de maturidade

Um componente **Stable** nunca pode depender de um componente ou engine **Preview**.
A cadeia de dependência só pode andar em um destes dois sentidos:

```
Stable  → Stable
Preview → Preview
```

Nunca `Stable → Preview`. Se um componente Stable descobre, depois de construído,
que depende de algo ainda Preview, ele **regride** para Preview até a dependência
estabilizar — não existe "Stable com uma exceção". Foi exatamente isso que aconteceu
com `DatePicker`/`DateRangePicker` quando o gap de teclado da `_calendar-engine` foi
encontrado: eles tinham funcionado no módulo Consultas, mas a dependência de uma
engine Preview os impedia de serem considerados Stable de verdade.

## 22. Release Gate

Evoluído do conceito original de Foundation Gate: à medida que a plataforma
amadurece, a pergunta de saída antes de qualquer onda nova deixa de ser só sobre
fundações e passa a cobrir a saúde da plataforma inteira. Sete perguntas, todas
precisam responder "não" para a próxima onda começar:

```
1. Existe fundação crítica em Preview?
2. Existe engine bloqueando consumidores?
3. Existe regressão visual?
4. Existe regressão de acessibilidade?
5. Existe regressão de API?
6. Existe regressão de performance?
7. Existe dependência de domínio ausente? (Interaction Matrix)
```

Se qualquer resposta for "sim", a plataforma não avança até resolver. "Fundação
crítica" continua definida pelos dois critérios do Foundation Gate original (seção
23) — a diferença é que agora isso é uma de sete perguntas, não a única.

A pergunta 7 é a Interaction Matrix (`docs/interaction-matrix.md` no Studio OS):
antes de iniciar qualquer módulo, mapear o que ele consome de cada domínio existente
e confirmar que toda dependência já está implementada — ou conscientemente aprovada
como débito técnico explícito, nunca descoberta no meio da implementação. Foi assim
que a Agenda foi bloqueada a favor de um módulo Quote mínimo, antes de custar caro
em contexto perdido no módulo mais complexo do roadmap.

## 23. Dependency Risk Matrix

Todo componente ou engine em **Preview** carrega, além do status, um nível de risco —
porque nem todo Preview é igualmente perigoso para o roadmap. O risco não mede a
qualidade do componente (isso é o que Stable/Preview já mede) — mede **o custo de
deixá-lo em Preview por mais tempo**.

```
CRITICAL → HIGH → MEDIUM → LOW
```

O critério é sempre o mesmo dos dois testes do Foundation Gate, mas em vez de uma
resposta binária (bloqueia/não bloqueia), vira uma escala:

- **CRITICAL** — consumida por múltiplos componentes **e** por um módulo do roadmap
  imediato. Bloqueia a onda atual.
- **HIGH** — consumida por múltiplos componentes, mas nenhum módulo imediato depende
  dela ainda. Não bloqueia a onda atual, mas é a próxima prioridade de estabilização.
- **MEDIUM** — consumida por um componente só, sem consumidor de módulo previsto no
  curto prazo.
- **LOW** — sem consumidor de plataforma além do próprio componente que a originou, e
  nenhum módulo do roadmap imediato depende dela.

Exemplo real desta rodada: **Number Engine é Preview / LOW** — é consumida por
`NumberInput` e `Stepper`, mas nenhum módulo do roadmap imediato (Navigation, App
Shell, Dashboard) depende dela. Se amanhã uma **Virtual List Engine** nascer Preview e
for consumida por Agenda, Clientes e Financeiro simultaneamente, ela nasce
**CRITICAL** — três consumidores de módulo de uma vez muda a matemática do risco
completamente, e bloqueia o roadmap até estabilizar.

---

## 24. Domain Readiness

Antes de iniciar qualquer módulo, uma pergunta obrigatória: **os domínios dos quais
ele depende já estão maduros?** Se não, o módulo não começa — primeiro estabilizamos
domínios, depois construímos orquestradores.

Todo módulo novo se declara como uma de duas coisas:

- **Domínio** — dono de conceitos, invariantes e eventos próprios (Clientes,
  Serviços, Financeiro). Modela-se o domínio primeiro (linguagem ubíqua, agregados,
  eventos), a persistência depois. Nada nasce pensando no banco.
- **Orquestrador** — conecta domínios existentes sem criar regras que pertencem a
  eles. **A Agenda é oficialmente um orquestrador**: conecta Clientes, Profissionais,
  Serviços, Consultas, Disponibilidade, Pacotes e Financeiro — e não pode conter
  nenhuma regra que pertença a esses domínios (ex: "cliente precisa de teste de
  mechas" é regra do domínio Cliente/Consulta; a Agenda apenas a consulta e obedece).

Ordem oficial do roadmap decorrente deste princípio: Clientes → Profissionais →
Serviços → Bundles → Consultas (refinamento) → Agenda → Financeiro → Estoque →
Portal → IA.

Registro histórico: **Workspace promovido a Stable** nesta rodada (dois consumidores
reais, Release Gate aprovado, achados incorporados). **Toast permanece Preview/HIGH**
até ser validado em criação, edição, exclusão, erro, sucesso, operações assíncronas
e rollback.

## 25. Temporal Truth

Sempre que uma informação possuir comportamento temporal — expira, muda de validade,
depende de "quando" para ser verdadeira — ela **não pode ser persistida como
boolean**. Deve ser modelada como registro (com data), evento, política ou
specification. Um boolean sem tempo é um dado errado por design: ele afirma para
sempre algo que só era verdade num instante.

Caso fundador: o Teste de Mechas, que existia como dois booleans divergentes
(`Customer.strandTestDone` e `Consulta.testeMechasFeito`) e virou
`RegistroTesteMechas` — entidade com data e validade no agregado Cliente, única
fonte de verdade; a Consulta pergunta, nunca guarda.

## 26. Domain Validation Report e Architecture Decision Log

**Nenhum domínio novo começa sem o Domain Validation Report do domínio anterior
concluído.** O relatório responde obrigatoriamente: fidelidade ao modelo original
(o que mudou, por quê), componentes de plataforma exercitados por camada, promoção/
regressão de maturidade, estado do Toast especificamente (dado seu histórico de
validação lenta e deliberada), oportunidades de `DecisionCard`, revisão de Domain
Model (conceitos teóricos vs. emergentes), auditoria de Temporal Truth, performance,
SaaS readiness, e lições aprendidas sinceras — o item mais importante, porque é o
que ensina algo para o domínio seguinte.

**Architecture Decision Log (`docs/ADL.md`)** é o histórico permanente das decisões
que mudaram a forma como o projeto pensa — não um ADR por decisão pequena, só as que
alguém precisaria entender daqui a dois anos sem reconstruir a conversa inteira. Toda
decisão registrada aqui (Headless First, Temporal Truth, Domain Readiness, Package
Topology...) ganha uma entrada no ADL no momento em que é tomada, não depois.

## 27. Capability over Attribute

Nenhuma capacidade de um profissional — ou de qualquer ator do sistema — é
representada por boolean. Um boolean (`podeAplicarBotox: true`) afirma uma
capacidade sem origem: não diz de onde ela vem, quando foi concedida, se ainda é
válida, nem o que a revoga. Toda capacidade nasce de uma **credencial**,
**certificação**, **especialidade** ou **política de negócio** explícita — cada uma
com proveniência e, quando fizer sentido, validade temporal (o que conecta este
princípio diretamente ao Temporal Truth, cap. 25).

Caso fundador: `Service.requiresCredential` já existia desde a arquitetura original
(gate de Botox) — este capítulo generaliza essa decisão pontual em princípio
permanente da plataforma.

## 28. SaaS First e Multi-tenancy Explícita

Decorrente do achado de SaaS Readiness do domínio Cliente: `organizationId` é
**obrigatoriamente o primeiro parâmetro de todo Application Service**, sem exceção,
desde a primeira linha de código — nunca inferido, nunca implícito, nunca
"funciona porque só existe um tenant hoje". Multi-tenancy não é uma migração futura;
é uma propriedade do tipo da função desde o dia em que ela nasce.

## 29. Catalog Over Logic

Nenhum fluxo da plataforma decide comportamento a partir do **nome** de um serviço.
Toda decisão vem de **atributos declarados no catálogo** —
`requiresCredential`, `recommendedSpecialties`, `priceStrategy.mode`,
`estimatedDuration`, `category`, `allowsPackage` — nunca de comparar strings como
`name === "Mechas"` ou `name.includes("Botox")`. O nome comercial é um rótulo de
exibição, renomeável a qualquer momento pela organização, e nunca pode ser a
fundação de uma regra de negócio.

Isso generaliza, para o domínio Serviços, o mesmo instinto por trás de Temporal
Truth (cap. 25) e Capability Provenance (cap. 27): informação com uma
responsabilidade não deve fazer o trabalho de outra. Nome identifica para humanos;
atributo controla comportamento — misturar os dois quebra no primeiro rename.

## 30. Derived Over Stored

Persistimos fatos. Derivamos conclusões. Sempre que uma informação puder ser
calculada a partir de fatos já persistidos, ela não existe como coluna própria —
existe como função, Specification ou query. Generaliza Temporal Truth (cap. 25) para
além de datas: o mesmo risco de divergência entre "o que foi gravado" e "o que é
verdade agora" vale para qualquer valor calculável, não só para booleans temporais.

Exemplos já aplicados na plataforma: `sessionsRemaining` (derivado de
`sessionsTotal - count(PackageUsage)`, nunca contador decrementado manualmente) ·
`requiresConsultation` (derivado de `priceStrategy.mode`, nunca campo próprio) ·
`clienteInativo`/`clienteEmRisco` (Specifications, nunca coluna de status).

## 31. Explicit Domain Rules

Nenhuma regra de negócio depende de nome comercial, texto livre, label ou
descrição — sempre de atributos explícitos e tipados do domínio. Generaliza Catalog
Over Logic (cap. 29) para todo o sistema, não só para Serviços: a mesma proibição de
decidir por `name === "..."` vale para decidir por qualquer string de exibição, em
qualquer domínio presente ou futuro.

## 32. Workflow Before UI

Nenhuma interface nasce antes de fluxo, estados, eventos e responsabilidades
estarem modelados. Generaliza, para todo domínio, a disciplina que já era praticada
implicitamente desde Cliente: a modelagem sempre veio antes do primeiro componente
de tela. Isso deixa de ser hábito e vira regra — nenhum domínio futuro pode pular a
etapa de modelagem "só para ver a tela funcionando".

## 33. Domain Pipeline

Artefato permanente — todo domínio, sem exceção, passa pelas mesmas sete etapas
antes de servir de dependência para outro módulo:

```
Modelagem → Aprovação → Implementação → Domain Validation Report
    → Interaction Matrix → Promotion Review → Liberado para consumo
```

Refina o fluxo corrigido após o episódio do domínio Profissional (que havia
"Uso Real" como etapa própria) — uso real é o que torna o Domain Validation Report
possível, não uma etapa separada que produz artefato próprio. A Interaction Matrix
passa a rodar **depois** do relatório de cada domínio, não só antes da Agenda: é
assim que uma dependência ausente (como Quote foi, para a Agenda) é descoberta no
domínio que a precisa, não depois de já estar implementando por cima do vazio.

Nenhum domínio está "pronto" só por estar implementado — só está **liberado para
consumo** depois de passar pelas sete etapas completas.

## 34. Snapshot Principle

Sempre que um documento representar um acordo entre partes — um orçamento enviado,
um recibo, uma proposta aceita — ele preserva um retrato fiel das informações no
momento da emissão. Snapshots existem para preservar contexto histórico, **nunca**
para controlar regra de negócio: nenhuma lógica da plataforma pode ler um campo de
snapshot para decidir comportamento — ele é evidência, não fonte de verdade.

Caso fundador: `OrcamentoItem.serviceNameSnapshot` e
`OrcamentoItem.durationMinutesSnapshot` — o catálogo pode renomear um serviço ou
ajustar sua duração depois; um orçamento já enviado ao cliente não muda de texto ou
de expectativa silenciosamente. Nenhuma Specification do domínio Quote lê esses
campos — eles existem só para exibição fiel do que foi cotado. Catalog Over Logic
(cap. 29) continua integralmente válido: o princípio proíbe *decidir* por nome,
nunca proíbe *exibir* um retrato histórico de nome.

## 35. Single Owner Principle

Cada informação da plataforma tem exatamente um domínio responsável por ela. Todo
outro domínio que precisa dessa informação **consulta**, nunca duplica, nunca
recalcula por conta própria, nunca guarda uma cópia sem que essa cópia seja um
Snapshot explícito (cap. 34) com essa natureza declarada. Duas peças duplicando o
mesmo fato sem um dos dois ser formalmente um snapshot é sempre um bug em
formação — a mesma classe de erro que Temporal Truth e Derived Over Stored já
combatiam, agora nomeada no nível de "quem é dono do dado", não só "como o dado é
representado".

Caso de aplicação: a Appointment Responsibility Matrix (Studio OS,
`docs/appointment-responsibility-matrix.md`) é o primeiro exercício completo deste
princípio — cada campo que o Appointment usa tem um dono explícito, e a Agenda só
possui, de fato, os campos que descrevem o próprio ato de agendar (horário, status,
nota), nunca os que descrevem cliente, profissional, serviço ou orçamento.

## 36. Cross-Domain Insights

Todo Decision Card (cap. da plataforma, Onda do Operating Center) se classifica em
uma de três categorias, o que orienta como o Dashboard e a futura IA os produzem:

- **Local** — dado de um único domínio (ex: "3 clientes fazem aniversário esta
  semana" — só Cliente).
- **Cross-Domain** — cruza dado de dois ou mais domínios que nenhum dos dois
  produziria sozinho (ex: "a credencial da Bia vence em 5 dias, 3 agendamentos desta
  semana dependem dela" — Profissional + Agenda).
- **Predictive** — depende de inferência sobre padrão histórico, não só leitura de
  estado atual (ex: "12 clientes costumam retornar neste período" — Specification
  `clienteInativo`, hoje com heurística simples, amanhã possivelmente alimentada por
  IA).

Essa classificação não é decorativa: **Local** pode nascer de uma Specification
pura dentro do próprio domínio; **Cross-Domain** só pode nascer em uma camada
orquestradora (Agenda, Dashboard) que já consulta os dois domínios envolvidos;
**Predictive** é o único tipo que depende do domínio IA existir para evoluir além de
heurística fixa.

## 37. Coordination Over Ownership

Um orquestrador coordena domínios — nunca se torna proprietário das informações que
pertencem a eles. O Appointment referencia Cliente, Profissional, Serviço e Quote
por id e consulta suas Specifications; nunca duplica seus dados. A única exceção
permitida é o Snapshot Principle (cap. 34) — e mesmo essa exceção é limitada aos
campos que descrevem *o próprio ato de coordenar* (duração e valor efetivos
daquele agendamento específico), nunca aos dados de identidade ou elegibilidade dos
domínios coordenados.

Generaliza, para todo orquestrador futuro da plataforma (não só a Agenda), a
distinção que a Appointment Responsibility Matrix (Studio OS) já tornou concreta:
coordenar é perguntar e reagir; possuir é decidir e persistir. Um orquestrador só
faz a primeira coisa.

## 38. Appointment Identity Principle

Após a criação, `customerId`, `professionalId`, `serviceId` e `quoteId` de um
Appointment nunca são alterados. Qualquer mudança nesses relacionamentos exige um
novo Appointment — nunca um `update` nos campos de identidade. Reagendamento é
`AppointmentCancelled` (`reason: RESCHEDULED`) seguido de um novo
`AppointmentScheduled`, correlacionados por `correlationId`, nunca uma transição de
estado especial ou uma edição in-place.

## 39. Snapshot Eligibility

Antes de criar qualquer snapshot, três perguntas — só se as três forem "sim" o
Snapshot Principle (cap. 34) se aplica:

1. Representa um documento histórico (algo que foi entregue/combinado com alguém)?
2. Precisa preservar contexto textual/numérico daquele instante especificamente?
3. Uma alteração futura na fonte mudaria o *significado* do que já foi
   registrado, não só o valor?

Se qualquer resposta for "não", o dado certo é uma referência viva (id), nunca uma
cópia. Foi este teste que distinguiu, na modelagem do Appointment, por que
`durationMinutesSnapshot`/`priceCentsSnapshot` são snapshots legítimos (as três
perguntas respondem sim) e por que nome de cliente/profissional/serviço não são
(a resposta 3 é não — ver nome atualizado não muda o significado de um agendamento
interno, diferente de um orçamento já entregue à cliente).

## 40. Engine Stress Test

Uma engine só é promovida para Stable quando serve **pelo menos dois consumidores
distintos sem necessidade de adaptação**. Não dois usos do mesmo tipo de consumidor
(dois `DatePicker`s, por exemplo) — dois consumidores estruturalmente diferentes,
que exercitam a engine em contextos que ela não foi originalmente pensada para
cobrir sozinha.

Caso em aberto no momento em que este capítulo nasce: `_calendar-engine`/
`_calendar-grid` serviu `DatePicker` e `DateRangePicker` — dois consumidores, mas do
mesmo tipo (seleção de data em popover). A Agenda visual é o primeiro consumidor
estruturalmente diferente (grade de horários × profissionais, não grade de dias de
um mês) — o resultado desse teste real decide se a engine é genuinamente
reutilizável entre camadas da hierarquia (cap. 19.2) ou se precisa de generalização
antes de merecer o status Stable que já carrega.

## 41. Platform Discovery

Quando um componente novo surge durante a implementação de um módulo:

```
1. Existe componente equivalente na plataforma? → reutiliza, não cria.
2. É específico deste módulo, sem sinal de reuso transversal? → permanece local.
3. Demonstra reutilização transversal real (não hipotética)?
      → interrompe a implementação, promove para @codechain/ui, só então continua.
```

A barra para o passo 3 é a mesma de sempre: reutilização **demonstrada**, não
antecipada. Um componente só sobe para a plataforma quando um segundo consumidor
real já está usando-o sem adaptação — nunca porque "parece que vai ser útil depois".

## 42. Interaction Readiness

Checklist permanente, aplicada antes de promover qualquer módulo com interação rica
(arraste, redimensionamento, navegação por grade) de Preview para Stable:

```
□ Teclado          □ Drag-and-drop      □ Resize
□ Animações        □ Acessibilidade     □ Performance
□ Responsividade   □ Feedback visual    □ Atalhos
```

Diferente do Platform Hardening (que audita a plataforma inteira), esta checklist é
por módulo — aplicada primeiro à Agenda, por ser o primeiro módulo com interação
rica o suficiente para justificá-la.

## 43. Financial Source of Truth

Nenhum valor financeiro existe duplicado. O Quote é o único dono do preço
negociado; o Appointment carrega um snapshot desse valor no momento do
agendamento (Snapshot Eligibility já aplicado antes deste princípio nascer); o
Financeiro **nunca recalcula preço** — ele registra fatos sobre dinheiro que
efetivamente mudou de mãos: recebimentos, estornos, descontos concedidos, formas
de pagamento, parcelamentos, conciliação. Serviço não calcula cobrança. Appointment
não calcula cobrança. Financeiro não calcula preço — só o que aconteceu com o preço
já definido em outro lugar.

## 44. Immutable Financial Ledger

Todo fato financeiro é imutável. Nenhum registro financeiro é alterado depois de
criado — nunca `UPDATE`. Correções, estornos e ajustes geram **novos registros**
que referenciam o original, nunca reescrevem o que já aconteceu. Este princípio é a
extensão natural de duas decisões já tomadas antes dele existir: reagendamento é
`cancelar + criar` (Appointment Identity Principle), nunca edição; estorno é uma
nova `Transaction` referenciando a original (Financial Source of Truth), nunca uma
edição do valor recebido. O Financeiro é o domínio onde essa disciplina importa
mais — um livro-razão que pode ser reescrito não é um livro-razão, é uma opinião.

## 45. Payout Snapshot Principle

Especialização do Snapshot Principle (cap. 34) para o ciclo de comissão: todo
`CommissionPayoutItem` guarda, no mínimo, `appointmentId`, `professionalId`,
`transactionId`, `commissionRateSnapshot`, `baseAmountSnapshot`,
`commissionAmountSnapshot` e `createdAt` — o suficiente para reconstruir uma
auditoria completa de "por que este valor foi pago" sem depender de nenhum estado
atual do Profissional/Appointment/Transaction, que podem mudar depois.

## 46. Commission Trigger Policy

Formaliza **quando** nasce o direito à comissão, como uma Policy explícita — nunca
hardcoded na Specification de cálculo. Dois modos nomeados desde já:

- **`ON_PAYMENT`** (implementado) — comissão só é considerada sobre dinheiro
  efetivamente recebido (`Transaction`).
- **`ON_COMPLETION`** (reservado, não implementado) — comissão nasceria na
  conclusão do atendimento, independente de recebimento.

A policy é um parâmetro de entrada da função de apuração, nunca uma ramificação
espalhada pelo código — trocar de `ON_PAYMENT` para `ON_COMPLETION` no futuro é
mudar o valor de uma configuração por organização (SaaS First), nunca refatorar
estrutura.

---

*"O sistema é a plataforma. O produto é a prova de que o sistema funciona."*
