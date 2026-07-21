# CodeChain Design System — Onda 3b (Forms: Seleção)

## Decisão registrada: SearchSelect não existe como componente separado

A lista original tratava `Combobox` e `SearchSelect` como dois componentes. Na
prática, ambos são popover + busca + lista filtrável + seleção única — a única
diferença é onde o filtro acontece (local vs. remoto). Construir os dois seria
duplicar 100% da casca visual e do comportamento de teclado no mesmo instante em que
o segundo arquivo fosse escrito. Um único `Combobox`, com a prop opcional `onSearch`,
cobre os dois casos. Ver princípio de motores compartilhados no Design Language e a
decisão explícita desta rodada: abstração elimina duplicação existente, nunca
antecipa duplicação futura — aqui a duplicação seria imediata, não futura, então a
fusão é a aplicação correta do princípio, não uma exceção a ele.

---

## Select

**Problema que resolve:** escolha única entre poucas opções conhecidas, sem
necessidade de busca — categoria de serviço, status de filtro, papel de usuário.

**Quando usar:** lista curta (até ~15 itens), todas visíveis de uma vez sem rolagem
excessiva.

**Quando NÃO usar:** lista longa ou quando a pessoa precisa digitar para encontrar o
item (aí é `Combobox`); nunca para seleção múltipla (`MultiSelect`).

**Dependências:** Radix Select — comportamento de listbox nativo (roles ARIA,
type-ahead por teclado) vem de fábrica, não é reimplementado.

**Módulos futuros:** Configurações (papel do usuário), Financeiro (forma de
pagamento), Serviços (categoria).

```tsx
<Select value={category} onValueChange={setCategory}>
  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="cabelos">Cabelos</SelectItem>
    <SelectItem value="bronze">Bronze & Pele Iluminada</SelectItem>
  </SelectContent>
</Select>
```

---

## Combobox

**Problema que resolve:** escolha única quando a lista é longa demais para rolar
(catálogo de serviços de um SaaS multi-tenant, lista de clientes) — a pessoa digita
para filtrar. Também cobre busca remota (ex: buscar cliente por nome direto no banco,
sem carregar a base inteira).

**Quando usar:** qualquer campo "buscar e escolher um" — profissional responsável por
um agendamento, cliente de um orçamento, serviço de um bundle.

**Quando NÃO usar:** lista curta e estática (`Select` é mais simples e não precisa de
`cmdk`); seleção múltipla (`MultiSelect`).

**Dependências:** `_combobox-shell.tsx` (interno, compartilhado com `MultiSelect`).

**Módulos futuros:** Consultas e Orçamentos (buscar cliente/serviço), Agenda (buscar
profissional), praticamente todo módulo com relacionamento N:1 para uma entidade que
pode crescer além de uma tela.

```tsx
<Combobox
  options={clientes}
  value={clienteId}
  onValueChange={setClienteId}
  onSearch={(query) => buscarClientes(query)}
  loading={isSearching}
  placeholder="Buscar cliente..."
/>
```

---

## MultiSelect

**Problema que resolve:** seleção de vários itens de uma lista pesquisável — serviços
incluídos em um `ServiceBundle`, tags de um cliente.

**Quando usar:** relação N:N onde a pessoa escolhe um subconjunto de uma lista
potencialmente longa.

**Quando NÃO usar:** poucas opções binárias — nesse caso, uma lista de
`CheckboxField` visíveis o tempo todo é mais rápida de operar que abrir um popover.

**Dependências:** `_combobox-shell.tsx` (mesma casca do Combobox — a duplicação real
que motivou a extração).

**Módulos futuros:** Bundles (quais serviços compõem o combo), Marketing (segmentar
campanha por tags de cliente).

```tsx
<MultiSelect
  options={servicosDisponiveis}
  values={servicosDoBundle}
  onValuesChange={setServicosDoBundle}
  placeholder="Serviços do combo"
/>
```
