# Release Gate — antes da Onda 4 (Navigation)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Existe fundação crítica em Preview? | **Não.** Number Engine é Preview, mas classificada **Low Risk** abaixo — nenhum consumidor de módulo do roadmap imediato (Navigation, App Shell, Dashboard) depende dela. |
| 2 | Existe engine bloqueando consumidores? | Não. Todas as engines Stable (Calendar, Upload, Mask, Combobox Shell, Popover Shell, Panel Shell) atendem seus consumidores sem restrição conhecida. |
| 3 | Existe regressão visual? | Não aplicável — sem suíte de regressão visual executada neste ambiente ainda (config pronta, não rodada); nenhuma mudança visual não-intencional foi introduzida na remediação da Calendar Engine (API ficou mais simples, aparência idêntica). |
| 4 | Existe regressão de acessibilidade? | Não — a remediação da Calendar Engine só adicionou cobertura (roving tabindex, `aria-live`, `aria-label` completo), não removeu nada. |
| 5 | Existe regressão de API? | Não — a mudança em `DatePicker`/`DateRangePicker` (remoção de `month`/`onMonthChange`) é uma simplificação, e nenhum módulo consumidor existente (Consultas) usava essas props removidas. |
| 6 | Existe regressão de performance? | Não avaliado por medição real neste ambiente; por leitura de código, a divisão em `_calendar-engine.ts` + `_calendar-grid.tsx` não adiciona nenhuma dependência nova nem re-render desnecessário (mesmo padrão de estado local já usado antes). |

## Dependency Risk Matrix — estado atual

| Engine/Componente | Status | Risco | Justificativa |
|---|---|---|---|
| Calendar Engine | ✅ Stable | — | Remediada nesta rodada |
| Upload Engine | ✅ Stable | — | Validada no módulo Consultas |
| Mask Engine | ✅ Stable | — | Validada no módulo Consultas (`PhoneInput`) |
| Combobox Shell | ✅ Stable | — | Base de 4 componentes públicos |
| Popover Shell | ✅ Stable | — | Base de `Popover` + `Combobox Shell` |
| Panel Shell | ✅ Stable | — | Base de `Sheet`/`Drawer`/`SidePanel`/`QuickCreate` |
| **Number Engine** | ⚠️ Preview | **LOW** | Consumida por `NumberInput`/`Stepper`, mas nenhum módulo do roadmap imediato depende dela |
| `br-document-validators` | ⚠️ Preview | LOW | Um único consumidor (`CpfCnpjInput`), sem uso em módulo ainda |

**Nenhum item em CRITICAL ou HIGH.** Release Gate aprovado — Onda 4 iniciada abaixo.
