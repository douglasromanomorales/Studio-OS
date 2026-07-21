# Domain Validation Report — Quote (Orçamentos)
Último domínio antes da Agenda ser oficialmente liberada

---

## 1. Fidelidade ao modelo

Mantido integralmente: `EXPIRADO` removido do enum, virou Specification
(`orcamentoExpirado`) · `valor` e `estimatedDuration` nunca existiram como colunas —
`OrcamentoItem` nasceu já com `valorTotal`/`duracaoEstimada` derivados, sem passar
por uma versão "errada" primeiro (diferente do Teste de Mechas e do
`Service.active`, que foram corrigidos depois de já existirem errados — aqui a
modelagem preveniu o erro antes do schema nascer). `serviceNameSnapshot` +
`durationMinutesSnapshot` aplicando Snapshot Principle nos dois campos que a
modelagem previu, não só no nome.

## 2. Componentes de plataforma exercitados

Primeira integração real: `Combobox` (seleção de serviço), `CurrencyInput`
(primeiro uso real em mutação, não só documentação), `QuickCreate` (terceiro
consumidor — Consultas, Clientes, agora Quote, zero adaptação de API de novo),
`Field`, `Toast` (`toast.success`/`toast.error` no fluxo de criação).

## 3. Toast — atualização de classificação

**Cenário novo validado:** criação de Quote com erro de domínio real (`podeSerAprovadoOuRecusado`
retorna motivo, não exceção crua) exercitando `toast.error` com uma mensagem de
negócio, não só validação Zod — mais próximo de um "erro assíncrono real" do que os
cenários anteriores. Ainda faltam: edição, exclusão, rollback, concorrência.
**Classificação mantida Preview/MEDIUM** — avançou em profundidade, não em
contagem de cenários novos.

## 4. QuoteAccepted (evento `orcamento.aceito`) — pontos de integração reservados

O evento é emitido em `aprovarOrcamento`, com o comentário explícito no código
listando os 5 consumidores futuros (Dashboard, Agenda, Financeiro, Notificações,
Decision Cards) — mesmo padrão do `AIInsight` reservado no Operating Center: a forma
existe, o consumo virá quando cada domínio downstream existir. Nenhum desses 5
consumidores foi implementado nesta rodada — corretamente, por Domain Readiness.

## 5. QuoteReadyForScheduling

Implementada como `prontoParaAgendamento` — hoje idêntica a `orcamentoAceito` (só
combina com a regra de expiração, que já exclui `APROVADO` por definição). A
Agenda, quando implementada, importa exatamente esta função — nunca reimplementa a
combinação de status+validade.

## 6. Temporal Truth / Derived Over Stored — auditoria

Nenhum boolean temporal introduzido. `validoAte` é a única data controlando estado,
e via Specification, não coluna de status. `OrcamentoItem` é o segundo caso (depois
de `sessionsRemaining`, ainda não implementado) de Derived Over Stored aplicado a
valores numéricos, não só a booleans — confirma que o princípio generalizou de
verdade, não ficou só no papel.

## 7. SaaS Readiness

`organizationId` primeiro parâmetro em todos os 4 Application Services
(`criarOrcamento`, `enviarOrcamento`, `aprovarOrcamento`, `recusarOrcamento`), desde
a primeira linha — terceiro domínio seguido sem repetir o achado original de
Cliente.

## 8. Lições aprendidas

1. **Modelar antes de implementar realmente evita a dívida, não só documenta a
   intenção de evitá-la.** Este é o primeiro domínio da série onde nenhuma correção
   pós-implementação foi necessária — porque as duas aplicações de Derived Over
   Stored (valor e duração) foram decididas *antes* do schema existir, não
   descobertas auditando código depois.
2. **QuickCreate como "sempre a mesma peça" continua se provando** — terceiro
   domínio, terceiro uso sem nenhuma mudança de API. Isso deixou de ser novidade;
   vale considerar isto oficialmente consolidado nas próximas rodadas, sem precisar
   reafirmar a cada relatório.
3. **Snapshot Principle e Catalog Over Logic não competem, se complementam.** A
   tentação ao ver `serviceNameSnapshot` seria achar que viola Catalog Over Logic —
   a distinção clara (decidir vs. exibir) evitou essa confusão apareceu na própria
   modelagem, antes de virar pergunta de code review depois.

---

## Promotion Review

Nenhum componente mudou de classificação nesta rodada — `Combobox`/`CurrencyInput`/
`QuickCreate`/`Toast` já estavam nos status corretos; esta integração reforça
evidência, não promove nada novo.

---

## Domain Pipeline — status final deste domínio

```
Modelagem ✅ → Aprovação ✅ → Implementação ✅ → Domain Validation Report ✅ (este documento)
    → Interaction Matrix → Promotion Review ✅ (seção acima) → Liberado para consumo
```

**Interaction Matrix ainda pendente para este domínio especificamente** — a matriz
completa (Cliente/Profissional/Serviço/Consulta/Quote) precisa ser reexecutada com
Quote presente antes do "liberado para consumo" ser formalmente carimbado, conforme
o próprio Domain Pipeline exige. Recomendo essa atualização como o passo imediato
antes de abrir a Agenda — não uma formalidade, é literalmente o gate que este
processo definiu.
