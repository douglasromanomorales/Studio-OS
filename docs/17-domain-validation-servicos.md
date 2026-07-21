# Domain Validation Report — Serviços

---

## 1. Fidelidade ao modelo

Manteve-se fiel integralmente: `PriceStrategy` como VO resolvido a partir de duas
colunas simples (não precisou de JSON) · `requiresConsultation` derivado, nunca
campo · `requiredCredential`/`recommendedSpecialties` mantidos separados exatamente
como aprovado · `Contraindication` implementada só como informativa, sem bloqueio
automático, conforme escopo consciente da modelagem.

**As duas violações encontradas na auditoria foram corrigidas nesta implementação,
não antes:**
- `Service.active` → `discontinuedAt: DateTime?` (e o mesmo em `ServiceBundle`, que
  tinha a mesma violação e não tinha sido mencionada explicitamente na modelagem —
  corrigida por analogia direta).
- `seed.ts` reescrito com atributos explícitos por entrada (`QuoteServiceSeed`/
  `FixedServiceSeed` tipados), zero `name === ...` ou `name.includes(...)`.

## 2. Componentes de plataforma exercitados

`Card`, `Badge` (5 variantes usadas: `danger` para gate duro, `warning` para teste
de mechas, `neutral` para especialidade recomendada, `brand` para "via consulta"),
`Breadcrumb`, `TopbarSlot`. Nenhum componente novo necessário — o catálogo é
apresentação de dado estruturado, não introduziu nenhuma interação nova.

## 3. Temporal Truth / Derived Over Stored — auditoria

`discontinuedAt` em `Service` e `ServiceBundle` — corrigido. `sessionsRemaining`
modelado como função pura desde já, embora `CustomerPackage`/`PackageUsage` ainda
não existam no schema (entram no domínio Bundles/Pacotes, próximo da fila) — a
assinatura já nasce certa para não repetir o erro quando esse domínio for
implementado.

**Nenhum boolean temporal novo encontrado** neste domínio além dos dois já
corrigidos.

## 4. Catalog Over Logic / Explicit Domain Rules

Confirmado nesta implementação: `resolvePriceStrategy`, `requiresConsultation`,
`isBookableDirectly` e `servicoDisponivel` — nenhuma função do domínio recebe ou
inspeciona `name`. O `name` só aparece na camada de apresentação (`page.tsx`), como
deveria.

## 5. SaaS Readiness

`organizationId` primeiro parâmetro em `cadastrarServico`/`descontinuarServico`/
`listarServicos`, desde a primeira linha — sem repetir o achado do domínio Cliente.
Nenhuma categoria/especialidade hardcoded no domínio; vivem só no seed.

## 6. Lições aprendidas

1. **A correção de `ServiceBundle.active` não estava na modelagem, mas era óbvia por
   analogia** — a modelagem auditou `Service.active` explicitamente e não mencionou
   `ServiceBundle`, que tinha exatamente o mesmo problema. Lição: ao corrigir um
   padrão de erro, vale checar todo o schema por instâncias do mesmo padrão, não só
   o local onde ele foi originalmente encontrado.
2. **PriceStrategy como VO não exigiu mudança de schema** — a resistência a
   modelar "direito" às vezes é medo de precisar de JSON/tabela nova; aqui, duas
   colunas simples + uma função de resolução bastaram. DDD pragmático (ADL-009)
   confirmado de novo.
3. **Requirements como dado puro, sem lógica de validade, manteve o domínio
   Serviços genuinamente desacoplado de Cliente/Profissional** — nenhuma import
   cruzada entre os três domínios, só um contrato de forma (nome do requisito como
   string) que cada lado interpreta à sua maneira.

---

## Promotion Review

Nenhum componente de plataforma mudou de maturidade nesta rodada — o domínio
Serviços não introduziu uso novo de nenhum Preview.
