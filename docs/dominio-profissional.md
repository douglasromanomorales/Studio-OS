# Domínio: Profissional
Studio OS · Modelagem DDD antes de qualquer implementação

---

## 1. O que é um Profissional

Uma pessoa que **executa** serviços dentro de uma organização — a contraparte direta
do Cliente no atendimento. Três decisões de fronteira:

1. **Profissional é por organização**, mesma decisão do Cliente — sem identidade
   global. Uma profissional que atende em dois salões do SaaS é dois Profissionais
   distintos.
2. **Profissional pode ou não ter conta de acesso ao sistema.** Uma manicure pode
   existir no domínio (para aparecer na agenda, receber comissão) sem nunca logar no
   Studio OS. Vínculo com `Membership`/`User` é opcional, não constitutivo — separa
   "é uma profissional da casa" de "tem acesso ao painel".
3. **Capacidade nunca é atributo do Profissional — é sempre proveniente.** Esta é a
   decisão que organiza o domínio inteiro (seção 3).

## 2. Ciclo de vida e estados

Mesmo padrão do Cliente: **estados operacionais são derivados**, nunca colunas.

```
CONVIDADA ──► ATIVA ──► DE_FÉRIAS/LICENÇA ──► INATIVA
(sem conta      (executa      (bloqueio de agenda      (sem atendimento
 ainda)          atendimentos)  temporal, com fim)       há N dias — derivado)
                                        │
                                        ▼
                                  DESLIGADA (persistido — decisão humana)
```

`ATIVA`/`INATIVA` são Specifications (baseadas em `WorkingHours` + histórico de
atendimento). `DE_FÉRIAS`/`LICENÇA` são um `ScheduleBlock` com intervalo de datas —
já existe no schema original, não é estado novo. `DESLIGADA` é o único estado
persistido (`terminatedAt`, Temporal Truth — nunca um boolean `ativo: false`).

## 3. Capacidade não é atributo — é proveniência (Capability over Attribute)

O erro que o princípio proíbe: `Professional.podeAplicarBotox: boolean`. A pergunta
certa nunca é "o que ela pode fazer" como flag — é "**de onde vem** a capacidade de
fazer isso":

```
Capacidade de executar um Serviço
         │
         ├── Credencial (ProfessionalCredential) — já existe no schema original:
         │   nome, registryNumber, validUntil. Temporal Truth nativo (validade).
         │   Ex: "Toxina Botulínica", registro no conselho, validade anual.
         │
         ├── Especialidade (nova — ProfessionalSpecialty) — não regulada
         │   externamente, mas declarada e com nível: "Coloração — Avançado".
         │   Diferente de Credencial: não expira por lei, mas pode ser revista
         │   (auto-declarada ou validada por outra profissional sênior).
         │
         └── Policy de organização — ex: "qualquer profissional pode executar
             Manicure" (nenhuma credencial exigida — ausência de exigência é a
             policy padrão, não um caso especial).
```

`Service.requiresCredential` (já existente) é a ponte: um serviço declara que
credencial exige; a capacidade de uma profissional específica é a existência de um
`ProfessionalCredential` correspondente, **válido na data do agendamento** — nunca
"ela tem `true` na coluna Botox".

## 4. Agregado, Entidades e Value Objects

### Agregado `Profissional` (raiz: Professional)

```
Profissional (Aggregate Root)
├── Identidade: id, organizationId (imutáveis)
├── VO Nome
├── membershipId (opcional — vínculo de acesso, não constitutivo)
├── VO CorAgenda — hex + invariante de contraste mínimo com texto (a11y da Agenda)
├── VO ComissaoBase — percentual padrão; pode ser sobrescrito por Serviço (já existe)
├── Credenciais: ProfessionalCredential[] — entidade filha, já existente
├── Especialidades: ProfessionalSpecialty[] — entidade filha, NOVA
├── Disponibilidade: WorkingHours[] + ScheduleBlock[] — já existentes
└── terminatedAt (Temporal Truth — nunca boolean `ativo`)
```

**Fora do agregado:** `ProfessionalService` (associação profissional↔serviço com
override de preço/duração) referencia ambos por id, não é filho de nenhum dos dois —
é sua própria entidade de relacionamento. `Appointment`, `Commission`,
`CommissionPayout` são domínios próprios (Agenda/Financeiro), nunca carregados junto.

### Value Objects

| VO | Invariante |
|---|---|
| `CorAgenda` | Hex válido; contraste mínimo AA contra `--text-on-brand` quando usada como fundo (a11y não é opcional mesmo em dado gerado) |
| `ComissaoBase` | 0–100%, nunca negativo, nunca >100% |
| `PeriodoCredencial` | `validUntil` opcional; se presente, deve ser posterior a `performedAt`/data de emissão |

## 5. Eventos de domínio

| Evento | Emitido quando | Consumidores |
|---|---|---|
| `profissional.cadastrada` | Criação | Auditoria |
| `profissional.credencial_registrada` | Nova credencial | Agenda (destrava serviços que exigiam), Auditoria |
| `profissional.credencial_expirada` | Cron detecta `validUntil` passado | Agenda (bloqueia novos agendamentos do serviço), Notification |
| `profissional.especialidade_declarada` | Nova especialidade | — (informativo por ora) |
| `profissional.bloqueio_agenda_criado` | Férias/licença registrada | Agenda |
| `profissional.desligada` | Decisão explícita | Agenda (bloqueia agendamento futuro), Financeiro (fecha comissões pendentes), Auditoria |

`credencial_expirada` é o evento mais importante do domínio: é o que torna
Capability over Attribute operante no tempo, não só na modelagem — sem ele, uma
credencial vencida continuaria "parecendo válida" até alguém checar manualmente.

## 6. Regras que pertencem × não pertencem

**Pertencem:** existência/validade de credencial · unicidade de nome de credencial
por profissional (não pode ter "Toxina Botulínica" cadastrada duas vezes) ·
proveniência de qualquer capacidade · desligamento bloqueia disponibilidade futura.

**NÃO pertencem:** se um horário está livre (Agenda — orquestrador, consulta
`WorkingHours`/`ScheduleBlock` deste domínio, não decide sozinho) · preço/comissão
final de um atendimento específico (Serviços/Financeiro — este domínio só guarda o
*padrão*) · quem pode ver a agenda de quem (Permissões/RBAC, já definido na
arquitetura original).

## 7. Specifications e Policies

- `TemCredencialValida(profissional, credencialNome, data)` — Specification central,
  substitui qualquer boolean de capacidade.
- `PodeExecutarServico(profissional, servico, data)` — combina
  `TemCredencialValida` (se `servico.requiresCredential`) com a Policy padrão
  (nenhuma credencial exigida = qualquer profissional pode).
  ```ts
  return !servico.requiresCredential || temCredencialValida(profissional, servico.requiresCredential, data);
  ```
- `ProfissionalAtiva(profissional, hoje)` — Specification de estado (seção 2), não
  persistida.
- **Policy de comissão** — `ComissaoBase` da profissional é o padrão; `Service`/
  `ProfessionalService` podem sobrescrever. A resolução final ("qual comissão vale
  neste atendimento") é uma função pura, não um campo — outra aplicação do mesmo
  princípio de proveniência.

## 8. Serviços

- **Application Services:** `cadastrarProfissional`, `registrarCredencial`,
  `declararEspecialidade`, `criarBloqueioAgenda`, `desligarProfissional` — todos com
  `organizationId` como primeiro parâmetro (regra recém-oficializada).
- **Domain Service:** `VerificacaoDeCredenciais` — cron diário que avalia
  `TemCredencialValida` contra todas as credenciais com `validUntil` próximo/passado
  e emite `credencial_expirada`. Cruza tempo com dado do agregado — por isso é
  Domain Service, não Specification pura chamada ad-hoc.
- **Repository:** convenção `tenantDb`, mesma decisão pragmática do domínio Cliente
  (ADL-009) — sem classe formal.

## 9. Headless First — aplicável?

**Não neste domínio, e isso é uma resposta válida.** Headless First existe para
comportamento de UI compartilhado entre componentes (calendário, upload). O domínio
Profissional não tem nenhuma peça de interface própria — ele é consumido pela UI
através dos primitivos já existentes (`Combobox` para selecionar profissional,
`Avatar`, `Badge` para credencial). Forçar uma "engine" aqui seria inventar
abstração sem duplicação real, exatamente o que o processo de 5 perguntas já
rejeitaria.

## 10. SaaS First e Multi-tenancy Explícita

Já embutido: profissional por organização (decisão 1), `organizationId` primeiro
parâmetro em todo Application Service (seção 8), credenciais/especialidades sem
nenhum valor hardcoded de negócio (nem "Toxina Botulínica" é um enum fixo — é uma
`String`, porque o próximo tenant do SaaS pode regular categorias diferentes que a
Casa Nataly nunca vai ter).

## 11. Informações obrigatórias × opcionais

**Obrigatórias:** nome, cor de agenda (com fallback determinístico se não escolhida,
mesmo padrão do `Avatar`), ao menos uma `WorkingHours` (sem grade, não é agendável —
mas pode existir cadastrada antes de definir grade, como rascunho).

**Opcionais:** vínculo de acesso (`membershipId`), comissão base (fallback: policy
da organização), credenciais/especialidades (ausência = só executa serviços sem
exigência), foto.

## 12. Dependências

**Depende de:** nada além da Organization (fundação já madura).
**Módulos que dependem dele:** Serviços (`ProfessionalService`), Agenda (orquestrador
— disponibilidade + capacidade), Financeiro (comissão), Consultas (avaliação
vinculada a uma profissional).

---

## Riscos e oportunidades de reutilização (para orientar a implementação)

**Riscos:** `VerificacaoDeCredenciais` como cron depende de infraestrutura de
scheduled jobs que ainda não existe no roadmap — implementação inicial pode ser uma
Specification chamada on-demand (toda vez que a Agenda perguntar), cron vem depois,
sem mudar a modelagem.

**Reutilização:** `TemCredencialValida`/`PodeExecutarServico` são o mesmo formato de
Specification usado em `existeTesteMechasValido` do domínio Cliente — Capability
over Attribute e Temporal Truth convergindo no mesmo padrão de código
(`registros[].validUntil` + "existe algum válido agora?"). Vale extrair, quando um
terceiro caso aparecer, uma Specification genérica de "registro com validade" —
ainda não agora (só dois casos, duplicação real exigiria três antes do processo
de extração da plataforma se aplicar aqui também, mesma disciplina de sempre).

---

Aguardando aprovação desta modelagem antes de implementar.
