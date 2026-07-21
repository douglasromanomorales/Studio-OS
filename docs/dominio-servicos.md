# Domínio: Serviços
Studio OS · Modelagem DDD antes de qualquer implementação

> ⚠️ **Duas violações reais encontradas no código já existente, ao auditar contra os
> princípios que este domínio precisa respeitar.** Não implementadas ainda —
> registradas aqui para correção quando a implementação começar. Ver seção 9.

---

## 1. O que é um Serviço

Uma unidade atômica de trabalho executável — o que uma profissional faz para uma
cliente, com duração, requisitos e estratégia de preço próprios. Identidade é o
`id`, nunca o nome comercial (**Catalog Over Logic**, cap. 29 — o nome é rótulo de
exibição, renomeável, e nunca pode controlar comportamento).

## 2. Fronteiras — o que pertence a cada conceito

| Conceito | Pertence a ele | Não pertence |
|---|---|---|
| **Serviço** | duração base, requisitos (credencial/especialidade/teste de mechas), estratégia de preço, categoria | disponibilidade de horário (Agenda), quem especificamente vai executar (Profissional×Serviço) |
| **Catálogo** | a coleção organizada de Serviços de uma organização — categorias, ordem, ativo/descontinuado | preço final cobrado (pode variar por profissional) |
| **Preço** | a *estratégia* declarada no Serviço (fixo ou sob avaliação) + o *valor* quando fixo | o preço final de um atendimento específico (isso é registrado no Orçamento/Appointment, um snapshot no momento da venda — preço do catálogo pode mudar depois sem afetar vendas já feitas) |
| **Pacote (Package)** | N sessões de um ou mais serviços, ao longo de uma validade — é uma **relação comercial no tempo** | não é o Serviço em si; referencia serviços, não os substitui |
| **Bundle** | combinação fixa de serviços cobrados como um preço único, consumidos numa **única visita** | não tem validade temporal — é atômico, executado ou não numa sessão |

A distinção Package × Bundle (já presente na arquitetura original) se confirma na
modelagem: Bundle é espacial (vários serviços, um momento), Package é temporal (um
ou mais serviços, várias sessões, uma janela de tempo).

## 3. Regras temporais × derivadas

**Temporais (Temporal Truth aplicado):**
- Validade de um Pacote comprado (`expiresAt`) — já é data, correto.
- **Achado nesta modelagem:** sessões restantes de um pacote **não deveriam ser um
  contador armazenado** (`sessõesUsadas` mutável, como o desenho original sugeria).
  Mesma classe de risco do Teste de Mechas: um contador pode divergir dos registros
  reais de consumo. Correção proposta: `sessõesRestantes` é **derivado** —
  `sessõesTotal - count(PackageUsage)` — nunca uma coluna que alguém decrementa
  manualmente.
- Reservado para o futuro, não implementado agora: vigência de estratégia de preço
  (promoções com início/fim) — o VO `PriceStrategy` já nasce com esse espaço, sem
  construir a funcionalidade antes de haver necessidade real.

**Derivadas (nunca persistidas):**
- `requiresConsultation` — **não é um campo próprio.** É derivado de
  `priceStrategy.mode === "QUOTE_REQUIRED"`. Um campo separado correria o risco de
  divergir do modo de preço (o mesmo tipo de duas-fontes-de-verdade do Teste de
  Mechas, agora no catálogo em vez do cliente).
- `isBookableDirectly` — `!requiresConsultation`.
- "Quais profissionais podem executar este serviço agora" — nunca armazenado;
  Specification do domínio Profissional (`podeExecutarServico`), que **consome** o
  requisito declarado aqui, não o duplica.

## 4. O que pertence à Agenda × ao Serviço

**Pertence ao Serviço:** duração *base* (`estimatedDuration`), requisitos, preço.

**Pertence à Agenda (orquestrador, sem regra própria):** se um horário específico
está livre; qual profissional está de fato disponível naquele instante; a duração
*efetiva* usada num agendamento (pode vir de `ProfessionalService.durationOverride`
— relação Profissional×Serviço, não é regra nova da Agenda nem do Serviço isolado).

A Agenda **consulta** três Specifications de três domínios diferentes (Cliente,
Profissional, Serviço) e combina o resultado — ela não decide nada sozinha. Isso já
era esperado pelo Domain Readiness (cap. 24), confirmado aqui do lado do Serviço.

## 5. Modelagem explícita

### Service (Aggregate Root)
```
Service
├── Identidade: id, organizationId, categoryId
├── name (rótulo — NUNCA controla comportamento, Catalog Over Logic)
├── VO Duration — minutos, invariante > 0
├── VO PriceStrategy — FIXED{amountCents} | QUOTE_REQUIRED
├── VO Requirements
│   ├── requiredCredential: string | null   (gate — Capability Provenance)
│   ├── recommendedSpecialties: string[]     (sinal, não bloqueio)
│   └── requiresStrandTest: boolean
├── Contraindications[] (entidade filha, ver seção 7)
└── discontinuedAt: DateTime | null   (Temporal Truth — nunca boolean `active`)
```

### Category
Taxonomia **por organização**, nunca enum fixo da plataforma (SaaS First — o
próximo tenant categoriza diferente). Só nome + ordem de exibição.

### Bundle (Aggregate Root próprio)
```
ServiceBundle
├── name, price (fixo — bundle não tem QUOTE_REQUIRED, é sempre vendido fechado)
└── items: ServiceBundleItem[] (referências a Service, por id)
```

### Package (Aggregate Root próprio)
```
PackageTemplate (o que se vende)
├── name, sessionsTotal, validityDays, price
└── (referencia Service via itens, mesmo padrão do Bundle)

CustomerPackage (o que foi comprado — snapshot no momento da venda)
├── templateSnapshot, sessionsTotal, expiresAt, status
└── sessionsRemaining → DERIVADO, nunca armazenado (correção da seção 3)
```

### PriceStrategy (Value Object, não entidade)
Discriminado por `mode`: `FIXED` carrega `amountCents`; `QUOTE_REQUIRED` não carrega
valor — o valor nasce do Orçamento (domínio já existente), nunca do catálogo.

### Requirements (Value Object)
Já detalhado na seção 5 do Service. Ponto central: **é só dado declarado** — a
lógica de "está satisfeito?" mora nos domínios Cliente/Profissional, não aqui. O
Serviço nunca importa `temCredencialValida` nem `existeTesteMechasValido` — ele só
expõe o requisito para quem perguntar.

### Contraindications (entidade filha, condicional)
Aplicável, mas com escopo consciente: hoje **só informativa**, exibida à
profissional durante a Consulta/atendimento — não é uma Specification que bloqueia
automaticamente, porque não existe ainda um domínio de intake médico estruturado
para validar contra ela (ex: "cliente grávida" não é um dado que o sistema captura
hoje). Bloqueio automático é evolução futura, não desta rodada.

## 6. Especialidades necessárias

`Requirements.recommendedSpecialties` é **sinal, não bloqueio** — diferente de
`requiredCredential` (gate duro). Uma especialidade recomendada ausente não impede
agendar; alimenta uma futura recomendação de IA ("a Bia é mais indicada para isso
por já ter feito 40 mechas este mês"), nunca trava a operação.

## 7. Boundaries confirmadas com o restante da plataforma

`Requirements` deste domínio é o que `Service.requiresCredential` já era na
arquitetura original — esta modelagem não inventa o conceito, só o promove a Value
Object com nome e fronteira explícitos, e adiciona `recommendedSpecialties` como
peça nova (conectando ao domínio Profissional recém-modelado).

## 8. SaaS First e Multi-tenancy Explícita

Category por organização (seção 5) · nenhum nome de serviço/categoria hardcoded no
domínio (vive só no seed da Casa Nataly) · `organizationId` primeiro parâmetro em
todo Application Service futuro deste domínio, sem exceção — mesma regra já
oficializada.

---

## 9. Achados de auditoria — não corrigidos ainda, propostos para a implementação

**Catalog Over Logic violado no seed já existente:**
```ts
requiresStrandTest: name === "Mechas (tradicionais, iluminadas e personalizadas)",
requiresCredential: name.includes("Botox") ? "Toxina Botulínica" : null,
```
Decide atributo comparando *string do nome comercial* — exatamente o padrão que o
princípio proíbe, mesmo sendo "só" dado de seed. Um rename de "Botox" para
"Toxina Botulínica" no catálogo comercial quebraria a atribuição silenciosamente.
**Correção proposta:** seed autora os atributos diretamente por entrada (tabela
explícita de dados), nunca derivando de substring do nome.

**Temporal Truth violado no schema já existente:**
```prisma
model Service {
  active Boolean @default(true)   // linha 186
}
model Professional {
  active Boolean @default(true)   // linha 220 — já corrigido no domínio Profissional!
}
```
`Service.active` é a mesma classe de erro que `Professional.active` já era antes da
correção aprovada na rodada anterior — só que ainda não tinha sido auditado neste
domínio. **Correção proposta:** `discontinuedAt: DateTime?`, mesmo padrão de
`terminatedAt`/`archivedAt`.

**Contador mutável de sessões restantes (seção 3):** `sessõesUsadas` como coluna
decrementável, proposto virar valor derivado de `count(PackageUsage)`.

Nenhuma das três correções foi aplicada — aguardando aprovação, conforme pedido.

---

Aguardando aprovação desta modelagem antes de implementar.
