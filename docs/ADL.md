# Architecture Decision Log (ADL)
CodeChain Design System & Studio OS

> Não é um ADR tradicional por decisão. É o histórico das decisões que **mudaram a
> forma como o resto do projeto pensa** — para que alguém entrando na CodeChain daqui
> a dois anos entenda o "por quê" sem precisar reconstruir a conversa inteira. Cada
> entrada é permanente; decisões revertidas ganham uma nova entrada apontando para a
> anterior, nunca editam a história.

---

### ADL-001 — Tokens semânticos separados de tokens de marca
**Contexto:** os primeiros 8 primitivos tinham `--color-terracotta` como token do
próprio sistema — funcionava com um cliente, quebraria no segundo.
**Decisão:** camada semântica (`--brand`, `--surface`...) no `@codechain/ui`; valores
reais de marca em `themes/*.css`, injetados via `data-theme`.
**Consequência:** todo componente futuro é reutilizável entre produtos por
construção, não por disciplina manual.

### ADL-002 — Separação Workspace × Shell
**Contexto:** "App Shell" misturava infraestrutura técnica (layout, foco, portais)
com experiência de produto (navegação real, marca).
**Decisão:** `Shell` = técnico, sem saber o que é Studio OS. `Workspace` = experiência
configurada por cima, reutilizável entre produtos CodeChain via `config`.
**Consequência:** trocar de produto é trocar `config`, nunca reescrever layout.

### ADL-003 — Headless First
**Contexto:** `_calendar-engine.tsx` original misturava aritmética de data com JSX,
sem que ninguém tivesse decidido isso — só aconteceu.
**Decisão:** toda engine nasce sem conhecer React/DOM/CSS/JSX; um adaptador separado
é o único ponto de contato com a UI.
**Consequência:** engines são testáveis com unit test puro; a divisão errada de
`_calendar-engine` foi corrigida no Foundation Gate como prova do princípio.

### ADL-004 — Package Topology: nenhum pacote sem consumidor real
**Contexto:** proposta inicial de 10 pacotes (`ui`, `forms`, `auth`, `core`, `charts`...)
antes de qualquer um deles ter conteúdo.
**Decisão:** só `@codechain/ui` existe até um domínio real justificar separar algo.
**Consequência:** zero pacote-fantasma versionado; `@codechain/br-validators`,
`@codechain/whatsapp` etc. nascem quando (e se) tiverem consumidor de verdade.

### ADL-005 — Agenda deixa de ser fundação e passa a ser orquestrador
**Contexto:** Agenda estava listada como módulo de fundação no roadmap original.
**Decisão:** Agenda conecta Clientes/Profissionais/Serviços/Consultas/Pacotes/
Financeiro, mas não possui regra própria — regra pertence ao domínio, Agenda só
consome.
**Consequência:** nova ordem de roadmap (domínios primeiro, orquestradores depois);
Domain Readiness (ADL-007) formaliza a regra geral por trás disto.

### ADL-006 — RegistroTesteMechas substitui os dois booleans divergentes
**Contexto:** `Customer.strandTestDone` e `Consulta.testeMechasFeito` — duas fontes
de verdade, nenhuma com data, ambas capazes de divergir.
**Decisão:** entidade filha `StrandTestRecord` no agregado Cliente, com data e
validade; Consulta pergunta, nunca guarda.
**Consequência:** caso fundador do princípio Temporal Truth (ADL-008).

### ADL-007 — Domain Readiness
**Contexto:** risco de construir orquestradores (Agenda) sobre domínios ainda
instáveis (Clientes, Serviços).
**Decisão:** nenhum módulo começa sem responder "os domínios de que depende já estão
maduros?". Se não, o módulo não começa.
**Consequência:** ordem de roadmap oficial: Clientes → Profissionais → Serviços →
Bundles → Consultas (refinamento) → Agenda → Financeiro → Estoque → Portal → IA.

### ADL-008 — Temporal Truth
**Contexto:** ADL-006 generalizado — qualquer informação com comportamento temporal
persistida como boolean é um dado errado por design.
**Decisão:** informação temporal vira registro, evento, política ou specification,
nunca boolean.
**Consequência:** achado retroativo no domínio Cliente (consentimento LGPD como dois
campos mutáveis, ver Domain Validation Report #1) — o princípio já está pegando
violações que escaparam mesmo depois de existir.

### ADL-009 — DDD pragmático para TypeScript + Prisma
**Contexto:** DDD tático completo (Factory/Repository como classes formais) pedido
para o domínio Cliente.
**Decisão:** Entities, Value Objects, Domain Events, Policies, Specifications e
Application Services são estrutura obrigatória. Factory e Repository formais são
convenção documentada, não classe — o ORM tipado já cumpre esse papel sem cerimônia
extra.
**Consequência:** domínio Cliente implementado sem camada de repositório própria;
critério vale para todo domínio seguinte.

### ADL-010 — Domain Validation Report obrigatório entre domínios
**Contexto:** risco de cada domínio novo repetir erros que um domínio anterior já
cometeu e corrigiu, sem registro formal do aprendizado.
**Decisão:** nenhum domínio novo começa sem o Domain Validation Report do domínio
anterior concluído — cobrindo fidelidade ao modelo, componentes de plataforma
exercitados, Temporal Truth, performance, SaaS readiness e lições aprendidas.
**Consequência:** o relatório de Clientes (docs/16) é a primeira instância; found real
findings (debounce duplicado, double-fetch, tenant não-threaded, consentimento
mutável) que só apareceram por existir a obrigação de auditar, não por acaso.

### ADL-011 — Capability over Attribute
**Contexto:** capacidades de profissionais (ex: aplicar Botox) sob risco de virarem
booleans (`podeAplicarBotox: true`) — mesma classe de erro do Temporal Truth, mas
sobre proveniência em vez de tempo.
**Decisão:** toda capacidade nasce de credencial, certificação, especialidade ou
policy explícita, nunca de um atributo solto.
**Consequência:** generaliza `Service.requiresCredential` (ADR original de Botox) em
princípio permanente, aplicado desde a primeira linha do domínio Profissionais.

### ADL-012 — organizationId obrigatório como primeiro parâmetro
**Contexto:** achado de SaaS Readiness do domínio Cliente — nenhum Application
Service recebia tenant explicitamente, funcionando por acidente com um único tenant.
**Decisão:** `organizationId` é o primeiro parâmetro de todo Application Service,
sem exceção, sem inferência implícita.
**Consequência:** regra de type-checking manual em toda revisão de código; nenhum
domínio futuro repete o acoplamento acidental encontrado em Clientes.

### ADL-013 — Interaction Matrix incorporada ao Release Gate
**Contexto:** a Interaction Matrix (revisão de dependências entre domínios,
recomendada antes da Agenda) encontrou uma dependência ausente — Quote/Orçamentos
nunca foi implementado, e a Agenda dependeria dele indiretamente.
**Decisão:** Release Gate ganha uma sétima pergunta: existe dependência de domínio
ausente? Nenhum módulo inicia sem a Interaction Matrix confirmando que toda
dependência existe ou foi conscientemente aprovada como débito técnico.
**Consequência:** Agenda bloqueada; módulo Quote (escopo mínimo) entra antes dela.

---

## Fases do Studio OS

```
Fase 1 — Foundation                    (✅ concluída)
  UI · Workspace · Domínios (Cliente, Profissional, Serviço, Quote, Appointment) · Agenda · Core Platform

Fase 2 — Business (parcial)            (✅ Financeiro Sprint 1-2, pausada pela auditoria)
  Financeiro Sprint 1-2

Fase 3 — Infrastructure Foundation     (em andamento)
  3.1 Prisma real · 3.2 Auth.js + RBAC · 3.3 AuditLog · 3.4 Observabilidade · 3.5 Remover mocks

Fase 4 — Financeiro Sprint 3 (Pix, Gateway, NF-e)
Fase 5 — Estoque
Fase 6 — Portal do Cliente
Fase 7 — IA / Intelligence

Version 1.0 Hardening — auditoria completa antes do primeiro cliente pagante fora
da Casa Nataly (performance, E2E, LGPD, observabilidade, OWASP, backup, stress
test de multi-tenancy, CI/CD, deploy, monitoramento).
```

A partir da Fase 3, a prioridade deixou de ser "próximo domínio de negócio" e
passou a ser "tornar o que já existe executável de verdade" — decisão direta da
Operational Hardening Audit (ADL-103/104).

### ADL-105 — Infrastructure Foundation Blueprint aprovado sem inconsistências
**Contexto:** primeira rodada de arquitetura de infraestrutura, avaliada contra
todos os princípios já registrados (DDD, Single Owner, Derived Over Stored,
Snapshot Principle, Temporal Truth, Cross Domain Insights, Platform Discovery).
**Decisão:** nenhuma inconsistência encontrada.
**Consequência:** `organizationId` como primeiro parâmetro permanece inalterado;
autenticação só passa a preencher esse valor a partir da sessão.

### ADL-106 — Soft delete permanece específico de domínio, nunca genérico
**Contexto:** infraestrutura de persistência normalmente sugere um campo
`deletedAt` genérico.
**Decisão:** rejeitado — cada domínio já tem seu campo nomeado
(`archivedAt`/`terminatedAt`/`discontinuedAt`).
**Consequência:** nenhuma migração de campo necessária; a decisão de nomear em
vez de generalizar, tomada domínio por domínio, se paga aqui.

### ADL-107 — correlationId de domínio e requestId de infraestrutura são conceitos separados
**Contexto:** observabilidade normalmente usa `correlationId` para rastrear uma
requisição — nome já ocupado por um conceito de domínio (Appointment,
CommissionPayout).
**Decisão:** infraestrutura usa `requestId`/`traceId`; `correlationId` permanece
exclusivo do significado de domínio já estabelecido.
**Consequência:** evita colisão de nomenclatura antes de virar confusão de código.

### ADL-108 — Sessão de banco em vez de JWT
**Contexto:** organization switching exige mutar `activeOrganizationId` de uma
sessão em andamento sem forçar reautenticação.
**Decisão:** sessão de banco (revogável, deslizante), não JWT stateless.
**Consequência:** trocar de organização é um `UPDATE` simples; sessões são
revogáveis server-side; reduz superfície de risco de JWT exposto ao cliente.

### ADL-109 — Login sem senha para todo realm, staff incluso
**Contexto:** o Blueprint original não havia decidido explicitamente o método de
login do realm staff.
**Decisão:** magic-link/OTP para staff e portal — nunca senha.
**Consequência:** elimina toda a superfície de risco de senha do sistema inteiro,
não só do portal.

### ADL-110 — Application Services permanecem com assinatura inalterada através de toda a Fase 3
**Contexto:** a introdução de auth/RBAC/audit poderia ter exigido reescrever
parâmetros de toda função de domínio já construída.
**Decisão:** confirmado, pela terceira vez em documentos consecutivos (Blueprint,
ITS, Release Gate), que nenhuma assinatura muda — infraestrutura entra ao redor
do Application Service, nunca dentro dele.
**Consequência:** o risco de regressão da Fase 3 fica concentrado só na correção
dos 3 bugs financeiros (ADL-103) e em infraestrutura nova, nunca em reescrever
lógica de domínio já validada.

### ADL-100 — Core Platform Complete
**Contexto:** Foundation (Fase 1) entregou `@codechain/ui`, Workspace, Operating
Center e os cinco domínios centrais (Cliente, Profissional, Serviço, Quote,
Appointment) com Agenda em Stable — todos passados pelo Domain Pipeline completo.
**Decisão:** a plataforma é considerada madura a partir deste marco. Todo módulo
novo (Fase 2 em diante) parte do princípio de que a infraestrutura já existe; um
componente/hook/engine novo só nasce mediante evidência explícita de que nada na
plataforma resolve o problema — nunca por suposição de que "provavelmente não
existe ainda".
**Consequência:** o padrão de "construir fundação enquanto se constrói produto" (que
definiu toda a Fase 1) termina aqui. Financeiro é o primeiro módulo da Fase 2,
consumidor puro da plataforma, sob esse padrão mais rígido de justificativa.

### ADL-101 — Commission eliminada como tabela
**Contexto:** a arquitetura original previa uma tabela `Commission` por
atendimento; a modelagem do domínio Financeiro reavaliou isso sob Derived Over
Stored.
**Decisão:** eliminada antes de existir — comissão devida é sempre
`priceCentsSnapshot × commissionRate`, calculada sob demanda; só
`CommissionPayout` (Sprint 2) é fato persistido.
**Consequência:** quarta vez nesta série que aplicar Derived Over Stored *durante
a modelagem* elimina uma entidade inteira antes de precisar de correção depois —
confirmação de que o Financial Domain Validation Report (Sprint 1) registra como
prova de maturidade do processo.

### ADL-102 — Commission Trigger Policy como parâmetro explícito, não ramificação
**Contexto:** o direito à comissão precisa suportar dois modos ao longo do tempo
(`ON_PAYMENT` agora, `ON_COMPLETION` reservado) sem exigir refatoração estrutural
quando o segundo for implementado.
**Decisão:** a policy é parâmetro de entrada da função de apuração, com
`ON_COMPLETION` lançando erro explícito enquanto não implementada — nunca uma
implementação parcial silenciosa.
**Consequência:** trocar de modo no futuro é mudar uma configuração por
organização, nunca reescrever a função de apuração.

### ADL-103 — Operational Hardening Audit encontrou 3 bugs financeiros reais
**Contexto:** primeira auditoria cross-domain completa da plataforma (Cliente,
Profissional, Serviço, Quote, Appointment, Financeiro).
**Decisão:** achados registrados no Technical Debt Register como dívida
bloqueadora; nenhuma correção implementada nesta rodada, por instrução explícita
de auditoria pura.
**Consequência:** próxima implementação financeira precisa resolver os 3 bugs
(soma de recebidos ignorando reversão, estorno sem `appointmentId`, taxa de
comissão capturada tarde demais) antes de qualquer novo recurso.

### ADL-104 — Ausência de auth/AuditLog/banco real formalmente reconhecida como bloqueadora de V1.0
**Contexto:** toda a implementação de domínio (Fase 1 completa + Financeiro
Sprints 1-2) rodou sobre dado mockado em memória, sem sessão/autorização real,
sem tabela de auditoria persistida.
**Decisão:** essas três ausências são bloqueadoras absolutas para operação real,
priorizadas acima de qualquer novo módulo de domínio.
**Consequência:** a fase seguinte à Operational Hardening deveria priorizar
infraestrutura (banco real + auth + observabilidade mínima), não um domínio novo
— mesmo que o roadmap de fases sugerisse Financeiro Sprint 3 ou Estoque em seguida.

### ADL-111 — Bug 3 (taxa de comissão retroativa) não corrigido — exige novo Domain Pipeline
**Contexto:** durante a execução autônoma da Fase 3.1, a correção completa do
Bug 3 do ADL-103 (taxa de comissão capturada tarde demais) se mostrou exigir uma
entidade nova (histórico de mudança de taxa por profissional).
**Decisão:** não implementada. Criar entidade nova é decisão de modelagem de
domínio, fora do escopo de autonomia operacional — corrigir "de qualquer jeito"
sem passar por Modelagem → Aprovação violaria o próprio Domain Pipeline que
protege a plataforma.
**Consequência:** Bug 3 permanece como dívida bloqueadora explícita (não
mascarada por uma correção parcial); resolução completa entra como item de
modelagem antes da Fase 3.5 tocar o Financeiro.

### ADL-112 — Restrição de ambiente descoberta durante Autonomous Execution Mode
**Contexto:** instrução de execução autônoma até V1.0 de produção, testada contra
o ambiente real desta sessão.
**Decisão:** confirmado por teste direto (`npm install`, teste de rede) que este
ambiente não tem acesso a registro npm, banco de dados real, ou serviços
externos — bloqueio de ferramenta, não de estratégia.
**Consequência:** autonomia operacional foi aplicada ao que é genuinamente
executável sem rede (código de infraestrutura real, correção de bugs de lógica
pura, testes escritos) — nunca a "V1.0 completo" fabricado. Continuação real
exige ambiente com rede, descrita no relatório desta rodada.

### ADL-113 — Retrofit de auth/RBAC/tenantDb completo nos 8 módulos de domínio
**Contexto:** Fase 3.5 (remover mocks) exigia substituir todo `TODO: tenantDb(...)`
por Prisma real, com `requireAuth`/`requireCapability` na fronteira de Server Action.
**Decisão:** aplicado uniformemente em Cliente, Profissional, Serviço, Consulta,
Quote, Appointment, Financeiro (2 sprints) — Application Service puro
(`organizationId` via `AuthContext`) + Server Action (auth/RBAC, nunca domínio).
**Consequência:** confirmação final da ADL-110 — nenhuma assinatura de domínio
precisou mudar; `tenantDb` ganhou parâmetro opcional de client para compor com
`$transaction` (achado real do retrofit de `remarcarAppointment`); `listarPendencias`
unificado para usar `estaInadimplente` como único critério (achado da Operational
Hardening Audit, corrigido de passagem); capacidade `servicos.ver` adicionada à
matriz de RBAC (Recepção não conseguia listar catálogo — achado real).

---

*Toda decisão que mudar a forma como o resto do projeto pensa ganha uma entrada aqui
— nunca só um commit ou um parágrafo perdido numa conversa.*
