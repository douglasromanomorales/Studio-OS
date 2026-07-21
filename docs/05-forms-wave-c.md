# CodeChain Design System — Onda 3c (Forms: Datas)

## Processo aplicado (exigido pela última diretriz)

Antes de escrever `DatePicker` ou `DateRangePicker`, a pergunta obrigatória: existe
motor comum? Sim — a grade de mês (navegação, cabeçalho de semana, células de dia,
estado "hoje") é idêntica nos dois; só a interpretação do clique muda (um valor vs.
início/fim de intervalo). Extraído primeiro: `_calendar-engine.tsx`, interno, nunca
exportado. Os dois componentes públicos vieram depois, como consumidores finos dele.

Para `TimePicker`, a mesma pergunta teve resposta diferente: **não existe duplicação
a resolver**, porque a estrutura que ele precisa (popover + lista pesquisável + item)
já existe em `_combobox-shell.tsx`, construída na Onda 3b. Construir um motor novo
aqui seria reorganizar sem necessidade — a última diretriz responde sozinha: isso não
simplifica nada para quem consome a plataforma. `TimePicker` é só uma lista de
horários gerada localmente, renderizada com peças que já existiam.

---

## `_calendar-engine.tsx` (interno)

Não é API pública. Renderiza a grade de mês e delega ao consumidor (`DatePicker` ou
`DateRangePicker`) o que significa clicar em um dia, via `onDayClick` + `isSelected` +
`isRangeMiddle`. Usa `date-fns` com locale `pt-BR` para nomes de mês/semana.

---

## DatePicker

**Problema que resolve:** seleção de uma única data — data de nascimento do cliente,
data de vencimento de um pacote, filtro de relatório por dia.

**Quando usar:** qualquer campo de data única em formulário.

**Quando NÃO usar:** seleção de intervalo (`DateRangePicker`); seleção de horário
(`TimePicker` — são conceitos diferentes, não o mesmo componente com granularidade
diferente).

**Dependências:** `_calendar-engine.tsx`, `_combobox-shell.tsx` (reaproveita o
popover, não reimplementa).

**Módulos futuros:** Clientes (nascimento), Pacotes (validade), Relatórios (filtro por
dia).

```tsx
<Field label="Data de nascimento" htmlFor="birth">
  <DatePicker value={birthDate} onValueChange={setBirthDate} />
</Field>
```

---

## DateRangePicker

**Problema que resolve:** seleção de um intervalo de datas — período de um relatório
financeiro, filtro de agendamentos por semana.

**Quando usar:** qualquer filtro ou campo que representa um intervalo, não um ponto no
tempo.

**Quando NÃO usar:** quando o intervalo é sempre um período fixo pré-definido (ex:
"hoje", "esta semana", "este mês") — nesse caso um grupo de `Button`/`Tabs` com
atalhos é mais rápido de operar do que abrir um calendário.

**Dependências:** `_calendar-engine.tsx` (mesma instância de componente que o
DatePicker usa — não há calendário duplicado no bundle).

**Decisão consciente de escopo:** a v1 mostra um mês por vez, não dois meses lado a
lado. Seletor de intervalo com dois meses simultâneos é um refinamento visual comum
em produtos maduros, mas nenhum módulo do roadmap atual precisa disso ainda — construir
agora seria antecipar necessidade, não resolver uma real. Fica registrado aqui para
reavaliar quando o Financeiro (item 14) definir os requisitos reais de filtro de
período.

**Módulos futuros:** Financeiro (fluxo de caixa por período), Relatórios.

```tsx
<Field label="Período" htmlFor="periodo">
  <DateRangePicker value={periodo} onValueChange={setPeriodo} />
</Field>
```

---

## TimePicker

**Problema que resolve:** seleção de horário a partir de uma grade de expediente (ex:
horários de 15 em 15 minutos entre 08h e 20h).

**Quando usar:** horário de início de um agendamento, horário de bloqueio de agenda.

**Quando NÃO usar:** duração (isso é um número de minutos, não um horário do relógio —
usar `NumberInput`, onda 3d).

**Dependências:** `_combobox-shell.tsx` — nenhuma implementação nova, só geração local
de opções (`generateSlots`).

**Módulos futuros:** Agenda (é o componente mais usado do módulo mais complexo do
roadmap — construído agora, sem pressa, para chegar pronto e testado quando a Agenda
começar).

```tsx
<Field label="Horário" htmlFor="hora">
  <TimePicker value={hora} onValueChange={setHora} stepMinutes={30} />
</Field>
```
