# Engine Stress Report — Calendar Engine × Agenda
Primeira aplicação do processo formalizado no cap. 40 do Design Language

---

## Tentativa de generalização

Ao construir a navegação por teclado da grade da Agenda (horário × profissional),
avaliei se `interpretCalendarKey`/`applyCalendarMove` (`_calendar-engine.ts`)
poderiam ser reaproveitadas — a estrutura visual das duas grades (roving tabindex,
uma célula focável, setas movem foco) é genuinamente parecida.

Tentativa concreta: mapear os eixos do calendário (linha = semana, coluna = dia da
semana) para os eixos da Agenda (linha = horário, coluna = profissional) através de
uma engine 2D genérica, parametrizada por `moveRow`/`moveCol` em vez de
`day`/`week`/`month`/`year`.

## Decisão tomada

**Não generalizar.** A Agenda ganhou sua própria navegação local
(`grid-navigation.ts`, módulo Agenda, não promovida).

## Motivo

Três problemas concretos apareceram ao tentar a generalização, não hipotéticos:

1. **Semântica de tecla invertida, não só reparametrizada.** No calendário,
   `ArrowUp`/`ArrowDown` movem uma *semana inteira* (7 dias), e `ArrowLeft`/
   `ArrowRight` movem um dia. Na Agenda, `ArrowUp`/`ArrowDown` movem um *slot de
   horário* (30 min), e `ArrowLeft`/`ArrowRight` trocam de profissional. Uma engine
   genérica teria que expor uma tabela de mapeamento tecla→eixo configurável por
   consumidor — nesse ponto, a "engine compartilhada" vira só um `switch` que cada
   consumidor teria que reconfigurar de qualquer jeito, sem eliminar código real.
2. **`Home`/`End`/`PageUp`/`PageDown` não têm equivalente natural na Agenda.** O
   calendário usa essas teclas para semana/mês/ano. A Agenda não tem esses
   conceitos — não há "mês" nem "ano" numa grade de um único dia. Forçar a engine
   a cobrir os dois exigiria inventar semântica sem uso real, ou tornar essas
   teclas opcionais por configuração — de novo, sem eliminar código, só
   adicionando indireção.
3. **`getMonthGrid` gera datas; a Agenda não usa datas para gerar a grade, usa
   profissionais** (uma lista arbitrária, não uma sequência calculável a partir de
   uma data). A geração de grade do calendário é aritmética de calendário; a da
   Agenda é sobre uma lista de entidades de negócio. Não são o mesmo problema com
   nomes diferentes — são dois problemas com uma coincidência visual de solução.

## Lições aprendidas

1. **Semelhança visual não é sinônimo de duplicação de lógica.** As duas grades
   parecem a mesma coisa a 10 metros de distância. De perto, os dados que cada uma
   organiza são estruturalmente diferentes — uma é sobre tempo, a outra é sobre
   tempo × uma lista de negócio. O Engine Stress Test existe exatamente para essa
   distinção não ser feita "no olho" antes de escrever código.
2. **A técnica (roving tabindex) é reutilizável; o conteúdo semântico
   (interpretação de tecla) não é, necessariamente.** Isso sugere uma fronteira
   mais fina do que "generalizar a engine inteira": o *padrão de implementação*
   (ref map, `useEffect` de foco, atributos ARIA de grid) poderia virar um guia de
   como construir esse tipo de componente — convenção documentada, não código
   compartilhado, mais próximo do que ADL-009 (DDD pragmático) já fez com
   Repository/Factory.
3. **O processo evitou uma abstração ruim, não só confirmou uma boa.** Generalizar
   sem tentar de verdade primeiro provavelmente resultaria numa engine com uma
   tabela de configuração por consumidor — o antipadrão que o próprio manifesto já
   proíbe (motor que encapsula agrupamento, não comportamento). O teste real, não
   a intuição, é o que deveria decidir isso — e decidiu.

## Resultado para a classificação de `_calendar-engine`

Mantida **Stable**, mas a natureza da evidência fica registrada com mais precisão:
Stable por dois consumidores do mesmo tipo de necessidade (`DatePicker`,
`DateRangePicker` — seleção de data), não por servir tipos estruturalmente
diferentes de grade. Não é uma reclassificação para baixo — é a mesma classificação
com a base de evidência declarada honestamente, em vez de inflada pela existência da
Agenda como se fosse um terceiro consumidor da mesma engine (não é).
