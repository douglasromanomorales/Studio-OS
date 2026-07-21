# Interaction Readiness — Agenda Visual
Primeira aplicação da checklist do cap. 42 do Design Language

---

> Mesma ressalva de todo relatório desde o Platform Hardening: itens marcados
> "confirmado por leitura de código" não foram executados neste ambiente (sem
> navegador/rede). Onde a resposta depende de rodar de verdade, digo isso.

| Item | Status | Nota |
|---|---|---|
| **Teclado** | ✅ Implementado, não executado | Roving tabindex local (`grid-navigation.ts`, 5 testes), Enter abre criação no slot focado |
| **Drag-and-drop** | ✅ Implementado, não executado | Pointer Events (não HTML5 DnD — mais controle sobre feedback visual em tempo real), otimista, `remarcarAppointment` chamado no `pointerUp` |
| **Resize** | ✅ Implementado, não executado | Alça na borda inferior do card, `ajustarDuracaoAppointment` com colisão recalculada |
| **Animações** | ✅ | `transition-shadow`/`translateY` usam tokens de motion do produto (`--dur-fast`), nunca cinematográfico (cap. 7) |
| **Acessibilidade** | ⚠️ Parcial | `role="grid"`/`gridcell`, `aria-label` nos slots vazios; **não implementado**: `aria-label` descritivo no card ocupado (hoje só o texto visual, sem leitura de status/horário por extenso para leitor de tela) — achado real, registrado para a próxima iteração, não esta |
| **Performance** | ✅ Por leitura | `React.useMemo`/`useCallback` nos pontos certos; grid renderiza `TOTAL_ROWS × profissionais` células — com 24 linhas × poucas profissionais é trivial; **não testado com volume real** (múltiplas profissionais, semana inteira) |
| **Responsividade** | ❌ Não implementado nesta rodada | O Blueprint (seção 7) definiu lista mobile como alternativa à grade — **não construída**. Registrado como pendência real, não escondida |
| **Feedback visual** | ✅ | Card semi-transparente durante arraste, anel de foco na célula ativa, toast em toda mutação |
| **Atalhos** | ✅ | `⌘K`/`⌘B` já globais (Workspace); `N`/setas específicos da grade via o mesmo padrão |

## Achados registrados, não corrigidos nesta rodada

1. **`aria-label` do card ocupado é insuficiente** — leitor de tela vê o texto
   visual (nome, serviço) mas não um resumo por extenso ("Ana Paula Ferreira,
   Bronze Natural, confirmado, 10h às 11h"). Corrigir antes de promover.
2. **View mobile (lista) não construída** — o Blueprint já previa isso como
   trabalho à parte; fica como próxima rodada explícita, não subentendida.
3. **Semana não implementada** — decisão consciente do Blueprint (seção 1), não
   esquecimento.

## Platform Discovery — o que aconteceu de fato durante esta implementação

- **`AppointmentCard`, `AgendaGrid`, `NovoAppointmentQuickCreate`,
  `AppointmentSheet`**: todos específicos do módulo Agenda, sem sinal de reuso —
  passo 2 do Platform Discovery (permanecem locais).
- **`grid-navigation.ts`**: avaliado contra `_calendar-grid` (Engine Stress Test),
  semântica de teclas incompatível — passo 2, permanece local, decisão justificada
  no próprio arquivo.
- **Correção real, não hipotética, encontrada no meio da implementação:**
  `_use-debounced-callback.ts` tinha sido promovido incorretamente para público
  numa passada anterior deste módulo, achando que Clientes o consumia — na
  prática, Clientes nunca importou o hook (usa `setTimeout` inline). **Revertido
  para interno** ao perceber que só existe um consumidor real (`Combobox`), não
  dois. É o primeiro caso desta série onde uma promoção foi desfeita por
  auto-correção, não por auditoria externa — sinal de que o processo está sendo
  aplicado com rigor mesmo quando o erro é meu.
- **`package.json` do design system não expunha `lib/*`** — descoberto ao tentar
  importar `cn()` do módulo Agenda. Corrigido (subpath adicionado); não é
  "promoção" de componente, é correção de configuração de pacote encontrada em uso
  real.

## Engine Stress Test — resultado

`_calendar-engine` **não foi generalizada**. A Agenda construiu sua própria
navegação de grade, local ao módulo (`grid-navigation.ts`), porque a semântica de
teclado é genuinamente diferente (eixos invertidos) — generalizar teria forçado uma
abstração comum onde não existe uma de verdade, só uma semelhança superficial de
"grade com roving tabindex". **Conclusão do teste: `_calendar-engine` continua
Stable, mas por evidência de dois consumidores do *mesmo tipo* de necessidade
(seleção de data), não de dois tipos estruturalmente diferentes.** Isso é uma
classificação mais honesta do que a que ela carregava antes — Stable, mas com o
tipo de evidência registrado, não inflado.

---

## Domain Pipeline — status do módulo Agenda (visual)

Ainda não liberado para "Stable" — faltam os itens de Acessibilidade e
Responsividade da checklist acima, que são bloqueadores explícitos, não notas de
rodapé. Recomendo tratá-los antes do próximo módulo (Financeiro) começar a
depender de qualquer padrão visual que a Agenda estabeleceu.
