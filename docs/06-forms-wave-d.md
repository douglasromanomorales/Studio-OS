# CodeChain Design System — Onda 3d (Forms: Inputs Avançados)

## `_number-value-engine.ts` (interno, headless)

Comportamento puro (clamp, step, teclado), sem nenhuma opinião visual — não renderiza
nada. Compartilhado por `NumberInput` e `Stepper` diretamente; `Slider` usa só a
função de arredondamento (`clampToStep`), delegando drag/teclado ao Radix Slider, que
já resolve isso de forma mais robusta do que valeria a pena reconstruir.

---

## NumberInput

1. **Duplicação real?** Sim, com Stepper — ambos são "valor numérico limitado, passo
   fixo, teclado". 2. **Comportamento compartilhado?** Clamp/step/arrow-keys.
   3. **Motor já existente?** Não antes desta onda — criado agora (`_number-value-engine`).
   4. **Componente novo?** Sim, camada de UI (campo de texto + spinner opcional).
   5. **Ou só composição?** Não — é a primeira UI pública sobre a engine nova.

**Problema que resolve:** entrada de quantidade com digitação livre e validação de
intervalo — nº de sessões ao criar um `PackageTemplate`, quantidade em movimento de
estoque.

**Quando usar:** quando a pessoa pode digitar um número diretamente, não só clicar.

**Quando NÃO usar:** valor monetário (`CurrencyInput`, onda 3a); quantidade pequena
onde clicar é mais rápido que digitar (`Stepper`).

```tsx
<Field label="Sessões do pacote" htmlFor="sessions">
  <NumberInput id="sessions" value={sessions} onValueChange={setSessions} min={1} max={50} showSpinner />
</Field>
```

---

## Stepper

Mesmo motor do NumberInput — só a camada de UI muda (sem campo de texto, só +/-).

**Problema que resolve:** ajuste rápido de quantidade pequena sem abrir teclado (em
mobile, isso é sensivelmente mais rápido que digitar).

**Quando usar:** quantidade de produto em uma venda rápida, nº de convidados.

**Quando NÃO usar:** intervalo amplo (min a max muito distantes — digitar é mais
rápido que clicar 40 vezes; use `NumberInput`).

```tsx
<Stepper aria-label="Quantidade" value={qty} onValueChange={setQty} min={0} max={20} />
```

---

## Slider

1. **Duplicação real com NumberInput/Stepper?** Parcial — mesmo conceito de valor
   limitado, modalidade de interação totalmente diferente (arraste). 2. **Comportamento
   compartilhado?** Só o arredondamento (`clampToStep`), não o teclado/drag. 3. **Motor
   já existente?** Radix Slider já resolve arraste+teclado — reconstruir isso na engine
   interna seria regressão, não reuso. 4/5. **Decisão:** UI nova sobre Radix Slider,
   reaproveitando só a função pura de arredondamento da engine, para que um valor de
   `step=5` se comporte de forma idêntica não importa se ajustado por Slider, Stepper
   ou NumberInput.

**Problema que resolve:** ajuste de valor contínuo dentro de um intervalo visualmente
intuitivo — desconto percentual, faixa de preço em filtro.

**Quando usar:** quando o intervalo importa mais que o valor exato (a pessoa quer "por
volta de 20%", não digitar "20" com precisão).

**Quando NÃO usar:** quando precisão exata importa (`NumberInput`) — arrastar é
impreciso por natureza, é uma escolha consciente de trade-off.

```tsx
<Slider aria-label="Desconto" value={discount} onValueChange={setDiscount} max={100} formatValue={(v) => `${v}%`} />
```

---

## Rating

1. **Duplicação real?** Não com a engine numérica — identidade ARIA diferente
   (radiogroup, não spinbutton). 2. **Comportamento compartilhado?** Com `RadioGroup`
   da Onda 2, sim — mesma primitiva Radix por baixo. 3. **Motor já existente?**
   `RadioGroupPrimitive` (dependência já presente). 4/5. **Decisão:** UI nova sobre uma
   primitiva já usada, não uma engine nova.

**Problema que resolve:** avaliação por estrelas — satisfação do cliente pós-
atendimento (mencionado na descoberta operacional, Fase 2 do roadmap de produto).

**Quando usar:** captura de nota simples 1–5.

**Quando NÃO usar:** NPS ou escala 0–10 (usar `Slider` ou botões numerados —
5 estrelas não comunica bem 11 pontos).

```tsx
<Rating aria-label="Avaliação do atendimento" value={rating} onValueChange={setRating} />
```

---

## OtpInput

1. **Duplicação real?** Sim — é literalmente um `MaskedInput` com pattern numérico
   fixo. 2. **Comportamento compartilhado?** 100% (máscara, dígitos, teclado numérico).
   3. **Motor já existente?** `MaskedInput`, Onda 3a. 4. **Componente novo?** Não.
   5. **É composição?** Sim — só estilo (segmentação visual) e `autoComplete`
   diferente. Nenhum arquivo de engine novo nasceu para isto.

**Problema que resolve:** confirmação de código enviado por WhatsApp/SMS — relevante
para o fluxo de Consultas (verificação de telefone) e para login do Portal do Cliente
sem senha (decisão já registrada no documento de arquitetura original).

**Quando usar:** qualquer código numérico de verificação de comprimento fixo.

**Quando NÃO usar:** senha alfanumérica (isso é `Input type="password"` comum).

```tsx
<OtpInput aria-label="Código de verificação" value={code} onValueChange={setCode} length={6} />
```
