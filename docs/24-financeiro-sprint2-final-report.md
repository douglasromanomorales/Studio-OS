# Financeiro — Sprint 2 (Comissões e Fechamento de Caixa)
Relatório final

---

## Domain Validation Report

### Fidelidade ao modelo
Mantida integralmente, incluindo a correção decidida na própria modelagem (comissão
deriva de recebido, não de devido) — implementada exatamente como especificado,
sem ajuste adicional. `Commission Trigger Policy` implementada como parâmetro
explícito (`apurarComissoesDoPeriodo(policy, ...)`), com `ON_COMPLETION` lançando
erro explícito em vez de silenciosamente não fazer nada — decisão consciente:
melhor falhar alto do que fingir suportar um modo não implementado.

### Payout Snapshot Principle — auditoria
`CommissionPayoutItem` tem os 7 campos mínimos exigidos: `appointmentId`,
`professionalId`, `transactionId`, `commissionRateSnapshot`, `baseAmountSnapshot`,
`commissionAmountSnapshot`, `createdAt`. Nenhum a menos.

### Immutable Financial Ledger — auditoria
`ajustarComissaoPaga` cria um novo `CommissionPayout` com `adjustsPayoutId`; não
existe função de edição de payout em nenhum lugar do código. `CashClosing` só tem
função de criação (`fecharCaixa`), nenhuma de edição.

### Platform Discovery — resultado desta rodada
**`Tabs` teve seu primeiro uso real** (Recebimentos/Comissões na mesma página) —
componente que estava em Preview desde a Onda 4 sem nenhum consumidor real até
agora. Nenhum componente novo foi necessário; nenhuma extração ocorreu.

### Lições aprendidas
1. **Falhar alto em vez de implementação parcial silenciosa foi a decisão certa
   para `ON_COMPLETION`.** Um `if` que "fizesse nada" pareceria funcionar e
   mascararia um bug de configuração até alguém mudar a policy da organização e
   descobrir, tarde, que nada acontece. O erro explícito custa uma exceção visível
   agora, não um mistério de produção depois.
2. **A correção de `comissaoDevida` do Sprint 1 → apuração do Sprint 2 não exigiu
   nenhuma mudança na função em si**, só na forma como ela é chamada (`amountCents`
   recebido, não `priceCentsSnapshot`). Reforça que a função pura já estava
   correta; o bug morava inteiramente na composição, não na unidade — o erro do
   Sprint 1 só apareceu ao desenhar o ciclo completo.

---

## Interaction Matrix (atualizada)

| Domínio | Appointment | Transaction | Profissional |
|---|---|---|---|
| **CommissionPayout** | ✅ (via CommissionPayoutItem) | ✅ (via CommissionPayoutItem) | ✅ (`commissionRate`, taxa) |
| **CashClosing** | ❌ | ✅ (soma do dia) | ❌ |

Nenhuma dependência ausente — Appointment, Transaction e Profissional já maduros.

## Release Gate

| # | Pergunta | Resposta |
|---|---|---|
| 1-6 | (mesmas do Sprint 1) | Sem regressão em nenhuma |
| 7 | Dependência de domínio ausente? | Não |

**Aprovado.**

## ADL — atualização

### ADL-102 — Commission Trigger Policy como parâmetro explícito, não ramificação
**Contexto:** o direito à comissão precisa suportar dois modos ao longo do tempo
(`ON_PAYMENT` agora, `ON_COMPLETION` reservado) sem exigir refatoração estrutural
quando o segundo for implementado.
**Decisão:** a policy é parâmetro de entrada de `apurarComissoesDoPeriodo`, com
`ON_COMPLETION` lançando erro explícito enquanto não implementada — nunca uma
implementação parcial silenciosa.
**Consequência:** trocar de modo no futuro é mudar uma configuração por
organização, nunca reescrever a função de apuração.

## SaaS Readiness — Sprint 2

```
☑ organizationId primeiro parâmetro em todo Application Service novo
☑ Commission Trigger Policy por organização (Organization.commissionTriggerPolicy),
  nunca hardcoded globalmente
☑ Nenhuma taxa de comissão hardcoded — sempre lida do Profissional
☑ Immutable Ledger — CommissionPayout e CashClosing só recebem INSERT
```

## Componentes reutilizados / promovidos

**Reutilizados:** todos os do Sprint 1 + `Tabs` (primeiro uso real) + `DatePicker`
(segundo domínio a usá-lo fora da Agenda). **Promovidos nesta rodada: nenhum** —
segundo sprint seguido sob o ADL-100 sem tocar em `@codechain/ui`.

---

## Veredito

Financeiro Sprint 2: concluído, Domain Pipeline completo. Restam, na sequência
definida: Financeiro Sprint 3 (Integrações — Pix, Gateway, NF-e, conciliação
bancária), depois Estoque.
