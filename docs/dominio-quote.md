# Domínio: Quote (Orçamentos)
Studio OS · Escopo mínimo — só o necessário para destravar a Agenda

> Fora de escopo nesta rodada, por instrução explícita: PDF, assinatura, gateway de
> pagamento, aprovação via WhatsApp, histórico avançado, versionamento. O domínio
> nasce pequeno de propósito — a pergunta que ele existe para responder é só uma:
> **"existe um Quote aceito?"**

---

## 1. O que é um Quote

A ponte entre uma Consulta avaliada e um Agendamento possível. Um Quote é uma
proposta de preço vinculada a uma Consulta específica — nunca existe sozinho, nunca
é criado sem uma Consulta `AVALIADA` por trás.

**Fronteira central:** Quote não é a Consulta (fotos, histórico, objetivo — isso já
existe e não se repete aqui) e não é o Agendamento (isso é responsabilidade da
Agenda, orquestrador). Quote é *só* a decisão de preço e aceite.

## 2. Estados — e o achado de Derived Over Stored

**Persistidos (decisão humana explícita):**
```
RASCUNHO ──► ENVIADO ──► APROVADO
                │
                └──────► RECUSADO
```

**Achado corrigido nesta modelagem:** o schema original tinha `EXPIRADO` como quinto
estado persistido. Isso viola Derived Over Stored (cap. 30) — expiração é sempre
calculável a partir de `validoAte`, nunca precisa de alguém (ou um cron, que nem
existe ainda) marcando o status manualmente. **Correção: `EXPIRADO` deixa de ser
estado do enum.** Vira Specification: `quoteExpirado(quote, hoje)` = está `ENVIADO`
e `validoAte` já passou. Um Quote `APROVADO` não expira mais — aceite é final no
escopo mínimo (versionamento/renegociação fica de fora, como já instruído).

Enum final, 4 estados: `RASCUNHO | ENVIADO | APROVADO | RECUSADO`.

## 3. Eventos de domínio

| Evento | Emitido quando |
|---|---|
| `quote.criado` | Profissional inicia a partir de uma Consulta `AVALIADA` |
| `quote.enviado` | Sai de rascunho, torna-se visível para aceite |
| `quote.aceito` | Aceite registrado — **este é o evento que destrava a Agenda** |
| `quote.recusado` | Cliente ou recepção recusa |

Nenhum `quote.expirado` — não é uma transição que alguém aciona, é uma leitura
(seção 2). Se um dia existir necessidade de notificar sobre expiração, isso é um
cron lendo a Specification, não um evento de domínio novo.

## 4. Responsabilidades — o que pertence ao Quote

**Pertence:** a validade da proposta, o estado de aceite, o vínculo com Consulta e
Profissional que avaliou, e — a partir desta revisão — a composição em `QuoteItem`
(seção 4.1).

**NÃO pertence:**
- Cálculo automático de preço unitário a partir do catálogo (cada `QuoteItem` traz
  o valor que a profissional definiu, mesma realidade operacional de "orçamento
  personalizado"; o catálogo informa *o quê*, nunca decide *quanto*).
- Qualquer coisa sobre agendamento — Quote não sabe o que é um horário.
- Qualquer coisa sobre pagamento — "aceite" é decisão comercial, não transação
  financeira (gateway está explicitamente fora).

### 4.1 QuoteItem — adicionado nesta revisão

Um Quote passa a ter um ou mais `QuoteItem`, cada um referenciando um `Service` por
id (nunca por nome — Catalog Over Logic) e carregando um valor próprio:

```
QuoteItem
├── quoteId
├── serviceId          — referência, nunca duplica atributos do Service
├── serviceNameSnapshot — nome capturado no momento da cotação (o catálogo pode
│                          renomear o serviço depois; o Quote já enviado ao cliente
│                          não deve mudar de texto silenciosamente)
└── amountCents        — valor deste item, definido pela profissional
```

**Consequência direta — Derived Over Stored aplicado de novo:** o valor total do
Quote **deixa de ser um campo próprio** (`Orcamento.valor` no schema original) e
passa a ser derivado: `soma(items[].amountCents)`. Guardar os dois (itens e um
total separado) seria recriar o mesmo risco de divergência do Teste de Mechas — só
que em dinheiro, onde o custo de um bug de dado é ainda mais direto.

`serviceNameSnapshot` é a única string armazenada que "parece" nome — e é
deliberado: é um retrato do passado (o que o cliente viu quando aceitou), não uma
referência viva ao catálogo. Nenhuma lógica lê esse campo para decidir comportamento
— ele existe só para exibição fiel do que foi cotado, o que não conflita com Catalog
Over Logic (o princípio proíbe *decidir* por nome, não proíbe *exibir* um nome).

## 5. Fronteiras com os domínios vizinhos

- **Consome Consulta** por id, somente leitura — nunca duplica foto/histórico.
  Regra de entrada: só cria Quote se `consulta.status === "AVALIADA"` (Domain
  Readiness aplicado dentro do próprio fluxo do Studio OS, não só entre módulos).
- **Consome Profissional** por id — quem fez a avaliação, referência simples.
- **Consome Serviço por id, através de `QuoteItem`** — cada item referencia um
  Service (revisão desta rodada); o Quote não itera o catálogo, só guarda a
  referência que a profissional escolheu.
- **É consumido pela Agenda** através de uma única Specification:
  `quoteAceito(quote, hoje)` — `status === "APROVADO"`. A Agenda nunca lê
  `items`/valor, nunca lê `Consulta` diretamente através do Quote; só faz a
  pergunta binária.

## 6. Regras de negócio

1. Quote só nasce de Consulta `AVALIADA` (não de `AGUARDANDO_AVALIACAO`).
2. Transição para `APROVADO`/`RECUSADO` só a partir de `ENVIADO` (nunca de
   `RASCUNHO` direto — precisa ter sido formalmente enviado).
3. Um Quote `ENVIADO` expirado (`quoteExpirado`) não pode mais ser aprovado — a
   Application Service de aceite rejeita com erro de domínio, não com exceção crua.
4. Uma Consulta tem no máximo um Quote **ativo** por vez (não persistido como
   constraint de "único" simples, porque Consultas recusadas podem gerar um novo
   Quote depois — a regra real é "no máximo um em RASCUNHO ou ENVIADO
   simultaneamente", validada na criação, não no schema).

## 7. Dependências e SaaS Readiness

Depende de: Cliente (maduro), Profissional (maduro), Serviço (maduro — consumido via
`QuoteItem`), Consulta (maduro). `organizationId` primeiro parâmetro em todo
Application Service, sem exceção, mesma regra de sempre.

---

Aguardando aprovação desta modelagem antes de implementar.
