# CodeChain Design System — Onda 3a (Forms: infraestrutura)

## Field / Label / HelperText / ErrorMessage

**Problema que resolve:** antes, `Field` vivia acoplado ao `Input`. Todo novo controle
de formulário (Select, DatePicker) precisaria reimplementar label/erro/hint do zero ou
importar um `Field` que carrega suposições de `<input>` que não se aplicam a ele.

**Quando usar:** em qualquer campo de formulário nomeado — se existe um rótulo visível
associado a um controle, é `Field`.

**Quando NÃO usar:** controles que já têm padrão de rótulo próprio por composição (ex:
`SwitchField`, `CheckboxField` da onda anterior) — esses já resolvem label internamente
para o caso específico de controles binários numa lista.

**Dependências:** nenhuma (é primitivo puro). **Componentes que dependem dele:**
todo o restante da Onda 3 (Select, DatePicker, MaskedInput e presets).

**Decisão arquitetural que justifica:** princípio de nomenclatura (seção 12 do
Design Language) — `Field` é um composite genérico, não deveria carregar o nome do
controle que primeiro o usou.

```tsx
<Field label="Nome completo" htmlFor="name" required error={errors.name}>
  <Input id="name" placeholder="Ex: Ana Paula" />
</Field>
```

---

## MaskedInput (motor)

**Problema que resolve:** entrada de texto com formato fixo posicional (telefone,
CPF/CNPJ, CEP) sem duplicar lógica de máscara em cada componente.

**Quando usar:** como base de qualquer preset de máscara por dígito. Raramente usado
diretamente — normalmente através de um preset (`PhoneInput`, `CepInput`).

**Quando NÃO usar:** formatação que não é posicional por dígito (moeda, que usa
`CurrencyInput` com `Intl.NumberFormat` por causa do separador de milhar móvel).

**Dependências:** `Input`. **Componentes que dependem dele:** `PhoneInput`,
`CpfCnpjInput`, `CepInput` — e qualquer máscara brasileira futura (ex: placa de
veículo, se algum módulo precisar).

**Decisão arquitetural:** um motor único com `pattern`/`resolvePattern` em vez de 5
componentes duplicados — ver ADR de Restrição no Design Language, seção 1.2, e a
justificativa completa na mensagem que abriu esta onda.

```tsx
<Field label="CEP" htmlFor="cep">
  <CepInput id="cep" onValueChange={({ raw }) => buscarEndereco(raw)} />
</Field>
```

---

## CurrencyInput

**Problema que resolve:** entrada de valor monetário sem os bugs clássicos de ponto
flutuante (`0.1 + 0.2 !== 0.3`) e com formatação BRL correta enquanto a pessoa digita.

**Quando usar:** todo campo de preço/valor do sistema — preço de serviço, valor de
orçamento, lançamento financeiro.

**Quando NÃO usar:** quantidades sem moeda (usar `NumberInput`, onda 3d).

**Dependências:** `Input`. **Módulos futuros que usarão:** Serviços (preço fixo),
Orçamentos (valor proposto), Financeiro (lançamentos) — praticamente todo módulo
depois de Bundles.

**Decisão arquitetural:** fonte da verdade é sempre inteiro em centavos, nunca `float`
de reais — isso casa diretamente com `Decimal(10,2)` do schema Prisma (conversão
cents → decimal acontece na borda da API, nunca no componente).

```tsx
<Field label="Valor do orçamento" htmlFor="valor">
  <CurrencyInput id="valor" valueInCents={value} onValueChange={setValue} />
</Field>
```

---

## PhoneInput, CpfCnpjInput, CepInput

**Problema que resolve:** os três formatos de documento/contato brasileiro mais comuns
em cadastro de cliente, sem reescrever máscara em cada tela que cadastra alguém.

**Quando usar:** cadastro de cliente (telefone é obrigatório desde a arquitetura
original), cadastro de organização/fornecedor (CPF/CNPJ, CEP).

**Quando NÃO usar:** `CpfCnpjInput` não deveria aparecer em tela que sabe de antemão
qual dos dois documentos espera (ex: um cadastro de pessoa física estritamente nunca
aceitaria CNPJ) — nesse caso, um `MaskedInput` com `pattern` fixo é mais correto que o
resolvedor dinâmico.

**Dependências:** `MaskedInput`, e `CpfCnpjInput` também depende de
`br-document-validators.ts` (validação de dígito verificador, lógica pura sem UI —
candidata a migrar para `@codechain/br-validators` no dia em que o backend também
precisar validar, ver ADR de topologia de pacotes).

**Módulos futuros:** Clientes (telefone — já no schema `Customer.phone`), Consultas
(retomada de contato), Financeiro/Configurações (CPF/CNPJ e CEP da organização, para
emissão de recibo).

```tsx
<Field label="Telefone" htmlFor="phone" required>
  <PhoneInput id="phone" onValueChange={({ raw }) => setPhone(raw)} />
</Field>

<Field label="CPF ou CNPJ" htmlFor="doc" error={!valid ? "Documento inválido" : undefined}>
  <CpfCnpjInput id="doc" onValidityChange={setValid} onValueChange={({ raw }) => setDoc(raw)} />
</Field>
```
