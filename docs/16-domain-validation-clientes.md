# Domain Validation Report — Cliente
Primeiro domínio completo sobre a Product Platform · referência para todos os próximos

---

## 1. Fidelidade ao modelo — o que mudou e por quê

**Manteve-se fiel:** Cliente sem entidade "Lead" separada · estados operacionais
derivados via Specification, nunca persistidos · Telefone como VO normalizado/único
por organização · fronteira Cliente ≠ Prontuário respeitada (nenhum dado clínico
entrou no agregado).

**Mudou — reduções de escopo conscientes:**
- **Policy `ClienteVIP`** foi modelada como "gasto acumulado, frequência, ou marcação
  manual" — só a marcação manual (`CustomerTag`) foi implementada. A avaliação
  automática por gasto depende do domínio Financeiro, que não existe. **Isto é o
  próprio princípio Domain Readiness em ação**, não uma falha: implementar a parte
  automática agora seria construir sobre uma fundação (Financeiro) que ainda não
  está madura.
- **`anonymizarCliente`** foi modelado (workflow LGPD completo) mas não implementado
  — depende de checar pendências financeiras, mesmo motivo acima. `arquivarCliente`
  (reversível) foi implementado; a anonimização (irreversível) fica para quando
  Financeiro existir.
- **`DetecçãoDeInatividade`** como Domain Service foi modelado como algo que cruza
  Cliente com histórico de atendimento — implementado como Specification pura
  (`clienteInativo`), mas **nunca chamado por nenhuma tela** ainda (ver item 6).

**Mudou — achado durante a auditoria, não durante a implementação original:**
Consentimento LGPD foi modelado como "imutável, revogação cria novo registro, nunca
sobrescreve" — mas implementado como dois campos mutáveis (`consentAt`,
`consentVersion`) no `Customer`. Isso é uma inconsistência real com o próprio
princípio Temporal Truth, coberta em detalhe no item 8.

## 2. Componentes da plataforma utilizados, por camada

| Camada | Componentes |
|---|---|
| Foundations | Tokens de cor/tipografia/motion (todo o módulo); nenhum hex/valor solto |
| Primitives | `Input`, `Card`, `Avatar`, `Badge`, `Button`, `Pagination`, `EmptyState`, `Skeleton`, `Toast` |
| Forms | `Field`, `PhoneInput`, `SwitchField` |
| Patterns | **Nenhum.** `DecisionCard` existe mas não foi usado — ver item 6 |
| Navigation | `Breadcrumb` (terceiro uso real) |
| Workspace | `TopbarSlot`, `ShellSidebar`/`ShellTopbar`/`ShellContent` (via layout), `SidebarNav`, `CommandPalette` (item de navegação adicionado) |

**Não utilizado, e isso é informativo:** `Combobox`. A lista de Clientes é uma busca
que filtra a própria página (padrão "lista filtrável"), não uma seleção de um item
para preencher um campo (padrão que o Combobox resolve). Confirma que os dois
padrões são genuinamente diferentes — não é uma lacuna, é a plataforma sendo usada
para o que ela é.

## 3. Componentes — evolução, promoção, e o que ficou igual

**Evoluíram (correção real encontrada nesta auditoria):**
- `Combobox` — extraído `use-debounced-callback (renomeado para público).ts`; duplicava a mesma lógica de
  debounce que o módulo Clientes escreveu de novo, na cara, sem eu perceber até
  reler o código com o rigor do relatório.

**Permaneceram inalterados (usados exatamente como documentado):** `Input`, `Card`,
`Avatar`, `Badge`, `Button`, `EmptyState`, `Skeleton`, `Field`, `PhoneInput`,
`SwitchField`, `Breadcrumb`, `TopbarSlot`.

**Promovidos nesta rodada:** ver Promotion Review (seção final).

## 4. Toast — atualização de classificação

**Validado nesta rodada:** ✔ criação (`cadastrarCliente` → `toast.success`) · ✔
sucesso · ✔ erro síncrono de validação (`toast.error` no `!result.ok`).

**Pendente:** edição, exclusão, rollback, erro assíncrono real (hoje o "erro" é só
validação Zod, nunca uma falha de rede/servidor de verdade), operações concorrentes.

**Classificação atualizada: Preview, Risk Level MEDIUM** (descendo de HIGH — 3 de 7
cenários validados, mais que dobrou a evidência desde o relatório anterior, mas
faltam os cenários que mais importam: erro assíncrono e rollback, que são exatamente
onde um sistema de toast mal feito costuma falhar).

## 5. QuickCreate — avaliação de promoção

Dois consumidores reais (Consultas, Clientes), **zero adaptação de API** entre eles
— o mesmo componente, as mesmas props, formulários de domínio completamente
diferentes por dentro. **Já era Stable desde a Onda 3.5** (primeiro componente a
completar o ciclo completo); esta rodada não promove, **reforça**: é hoje o
componente com a evidência de reuso mais forte de toda a plataforma.

## 6. DecisionCard — oportunidade dentro de Clientes

**Existe oportunidade, não implementada.** A Specification `clienteInativo` foi
escrita no domínio e nunca chamada por nenhuma UI — exatamente o tipo de lacuna que
o item 7 pede para expor. O lugar certo seria um `DecisionCard` no topo da lista de
Clientes: *"12 clientes costumam retornar neste período e ainda não agendaram."* —
literalmente o exemplo que abriu a conversa sobre o Operating Center.

**Por que não implementei agora:** este relatório é para observar e decidir, não
para expandir escopo por conta própria no meio de uma auditoria. Registro como
recomendação concreta para a próxima iteração do módulo Clientes, não como
pendência técnica silenciosa.

## 7. Revisão do Domain Model

**Ficou teórico, nunca chamado por UI:** `DetecçãoDeInatividade`/`clienteInativo`
(item 6) · `clienteEmRisco` (mesma situação) · `aniversarianteNoPeriodo` (existe,
sem consumidor).

**Ficou teórico, nunca implementado:** Policy automática de VIP, `anonymizarCliente`
(item 1 — ambos por Domain Readiness, não por esquecimento).

**Surgiu durante a implementação, não estava explícito na modelagem original:**
`CustomerTag` como entidade própria com `@@unique([customerId, label])` — a
modelagem falava de "Tags" genericamente; a implementação formalizou como agregado
filho com invariante de unicidade, o que é uma decisão de schema legítima que a
modelagem não precisava antecipar.

## 8. Temporal Truth — auditoria completa

**Achado real:** `Customer.consentAt` + `Customer.consentVersion` são dois campos
mutáveis representando algo que a própria modelagem descreveu como "imutável,
revogação cria novo registro". Hoje, revogar consentimento (ainda não implementado,
mas o schema já entalha o erro) só poderia *sobrescrever* esses campos ou zerá-los —
perdendo o histórico de quando o consentimento foi dado e retirado. Isso é
exatamente o padrão do bug original do Teste de Mechas, só que ainda não explodiu
porque nenhuma tela de revogação foi construída.

**Correção proposta, não implementada (regra do item 8):** substituir os dois campos
por uma entidade filha `ConsentRecord` (customerId, version, action:
`GRANTED`\|`REVOKED`, at: DateTime) — mesmo padrão do `StrandTestRecord`. A pergunta
"cliente tem consentimento válido agora?" vira uma Specification (`temConsentimentoValido`),
não uma leitura de coluna.

**Nenhum outro boolean temporal encontrado** no restante do schema deste domínio —
`archivedAt`/`anonymizedAt` já nasceram como timestamp, não boolean, aplicando
Temporal Truth mesmo sem eu ter checado explicitamente item por item na hora (bom
sinal de que o princípio já influencia decisões por hábito, não só por checklist).

## 9. Performance

**Corrigido nesta auditoria** (não esperei um próximo domínio para arrumar):
- Debounce duplicado entre `Combobox` e `ClientesList` → extraído
  `use-debounced-callback (renomeado para público).ts`.
- Dois `useEffect` causando fetch duplicado por tecla digitada → unificado em um
  efeito reagindo a `[query, page]`, com o reset de página movido para dentro do
  handler de evento síncrono.

**Observado, não corrigido (fora de escopo real ainda):** a busca por nome hoje é
`includes()` em memória sobre 23 registros mock. Em Postgres real, busca por nome
precisa de índice adequado (trigram/`pg_trgm` ou full-text) — telefone já está
coberto pelo índice de unicidade. Não é urgente com o volume atual de qualquer
tenant realista, mas fica registrado para não ser descoberto tarde.

## 10. SaaS Readiness

**Achado real, corrigido nesta rodada:** nenhum Application Service recebia
`organizationId` explicitamente — funcionavam por acidente porque só existe um
tenant mockado. Corrigido: `cadastrarCliente`, `listarClientes`,
`registrarTesteMechas` e `arquivarCliente` agora recebem `organizationId` como
parâmetro explícito, threading de ponta a ponta desde o componente React (hoje uma
constante `ORGANIZATION_ID`, substituída por sessão real quando auth existir). Esta
é a correção mais importante da auditoria para o futuro SaaS — sem ela, todo domínio
seguinte repetiria o mesmo acoplamento acidental, e descobrir isso com Profissionais
*e* Serviços já implementados teria sido mais caro.

**Nenhuma outra regra encontrada acoplada à Casa Nataly especificamente** — nomes,
categorias e valores específicos da Nataly vivem no seed (`prisma/seed.ts`), nunca
no código do domínio.

## 11. Lições aprendidas

1. **Temporal Truth precisa ser verificado campo a campo, não sentido por hábito.**
   `archivedAt`/`anonymizedAt` nasceram certos por instinto; `consentAt` nasceu
   errado pelo mesmo instinto, no mesmo módulo, na mesma sessão de implementação. O
   princípio existir no manifesto não substitui a checagem explícita — é por isso
   que o item 8 do relatório precisa continuar obrigatório em todo domínio futuro,
   não vira dispensável depois do primeiro acerto.
2. **Duplicação entre módulo e plataforma é tão real quanto duplicação dentro da
   plataforma.** O debounce duplicado não apareceu numa onda de componentes — surgiu
   porque escrevi código de módulo sem checar se a plataforma já resolvia aquilo.
   Lição prática: antes de escrever qualquer `useEffect`/`setTimeout` num módulo,
   perguntar se `@codechain/ui` já tem a peça.
3. **Tenant-scoping por convenção falha silenciosamente.** Não bastava o schema ter
   `organizationId` — as funções que o consomem precisavam declará-lo explicitamente
   na assinatura, ou o "funciona hoje" mascara um bug de SaaS que só aparece com o
   segundo tenant. Regra prática para Profissionais/Serviços: todo Application
   Service novo nasce com `organizationId` como primeiro parâmetro, sem exceção,
   desde a primeira linha.
4. **Domain Readiness evitou trabalho, não só organizou o roadmap.** `anonymizarCliente`
   e a Policy de VIP automática não foram "esquecidas" — foram conscientemente não
   construídas porque o domínio de que dependem (Financeiro) não existe. Isso é o
   princípio funcionando, não uma lacuna a cobrar.
5. **Um domínio bem modelado ainda pode ter Specifications mortas.** `clienteInativo`
   e `clienteEmRisco` existem, são testadas, e não são usadas em nenhuma tela. Modelar
   o domínio primeiro é certo, mas não é garantia de que a UI vai consumir tudo que o
   domínio oferece — isso exige revisão de UI tão deliberada quanto a modelagem foi.

---

## Promotion Review

| Item | Antes | Depois | Justificativa |
|---|---|---|---|
| `QuickCreate` | Stable | **Stable (reforçado)** | 2º consumidor real, zero adaptação |
| `Toast` | Preview / HIGH | **Preview / MEDIUM** | 3 de 7 cenários validados; faltam os mais arriscados (erro assíncrono, rollback, concorrência) |
| `Pagination` | Preview | **Stable** | Único consumidor até aqui, mas funcionou sem nenhuma modificação na primeira integração real — mesmo critério já aplicado a outros primitivos nesta plataforma |
| `DecisionCard` | Preview | **Preview (inalterado)** | Sem segundo consumidor; oportunidade documentada (item 6), não implementada |
| `Workspace` | Stable | **Stable (inalterado)** | Terceiro módulo real (Clientes) reforça, não muda, a promoção já concedida |
| `Combobox` | Stable | **Stable (inalterado)** | Não usado neste domínio por não ser o padrão certo para esta UI — ausência de uso não é regressão |
