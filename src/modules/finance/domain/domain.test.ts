import { describe, it, expect } from "vitest";
import { addDays, subDays } from "date-fns";
import {
  totalRecebidoDoAppointment,
  saldoDevedor,
  estaInadimplente,
  saldoCaixa,
  comissaoDevida,
  descontoConcedido,
  apurarComissoesDoPeriodo,
  totalPayout,
  diferencaFechamentoCaixa,
  type TransactionFact,
} from "./specifications";

const tx = (overrides: Partial<TransactionFact>): TransactionFact => ({
  id: "t1",
  type: "INCOME",
  amountCents: 10000,
  appointmentId: "a1",
  reversalOfId: null,
  ...overrides,
});

describe("totalRecebidoDoAppointment", () => {
  it("soma só INCOME do appointment certo", () => {
    const txs = [tx({ id: "t1", amountCents: 10000 }), tx({ id: "t2", amountCents: 5000 }), tx({ id: "t3", appointmentId: "outro", amountCents: 9999 })];
    expect(totalRecebidoDoAppointment("a1", txs)).toBe(15000);
  });

  it("CORREÇÃO ADL-103: exclui transação já estornada — antes desta correção, o valor estornado ainda era contado como recebido", () => {
    const txs = [
      tx({ id: "t1", amountCents: 10000 }),
      tx({ id: "t2", type: "EXPENSE", amountCents: 10000, reversalOfId: "t1" }),
    ];
    expect(totalRecebidoDoAppointment("a1", txs)).toBe(0);
  });

  it("uma reversão em si nunca conta como recebimento, mesmo isolada", () => {
    const txs = [tx({ id: "t1", type: "EXPENSE", amountCents: 5000, reversalOfId: "outro-t" })];
    expect(totalRecebidoDoAppointment("a1", txs)).toBe(0);
  });
});

describe("saldoDevedor — Derived Over Stored", () => {
  it("diferença entre devido e recebido", () => {
    const txs = [tx({ amountCents: 8000 })];
    expect(saldoDevedor(12990, "a1", txs)).toBe(4990);
  });

  it("nunca fica negativo mesmo com recebimento a mais", () => {
    const txs = [tx({ amountCents: 20000 })];
    expect(saldoDevedor(12990, "a1", txs)).toBe(0);
  });
});

describe("estaInadimplente", () => {
  const hoje = new Date(2026, 6, 16);

  it("só considera Appointment DONE", () => {
    expect(estaInadimplente({ id: "a1", priceCentsSnapshot: 10000, endAt: subDays(hoje, 1), status: "SCHEDULED" }, [], hoje)).toBe(false);
  });

  it("DONE com saldo devedor e prazo vencido: inadimplente", () => {
    expect(estaInadimplente({ id: "a1", priceCentsSnapshot: 10000, endAt: subDays(hoje, 1), status: "DONE" }, [], hoje)).toBe(true);
  });

  it("DONE mas já quitado: não inadimplente", () => {
    const txs = [tx({ amountCents: 10000 })];
    expect(estaInadimplente({ id: "a1", priceCentsSnapshot: 10000, endAt: subDays(hoje, 1), status: "DONE" }, txs, hoje)).toBe(false);
  });
});

describe("saldoCaixa", () => {
  it("soma líquida — entrada positiva, saída negativa", () => {
    const txs = [
      { type: "INCOME" as const, amountCents: 20000 },
      { type: "EXPENSE" as const, amountCents: 5000 },
    ];
    expect(saldoCaixa(txs)).toBe(15000);
  });
});

describe("comissaoDevida — derivada, nunca armazenada antes do pagamento", () => {
  it("calcula percentual sobre o valor devido do atendimento", () => {
    expect(comissaoDevida(10000, 40)).toBe(4000);
  });
});

describe("descontoConcedido", () => {
  it("diferença entre devido e recebido, nunca edita o Quote", () => {
    expect(descontoConcedido(10000, 9000)).toBe(1000);
  });
  it("sem desconto quando recebeu o valor cheio", () => {
    expect(descontoConcedido(10000, 10000)).toBe(0);
  });
});

describe("apurarComissoesDoPeriodo — Commission Trigger Policy", () => {
  const appointments = [
    { id: "a1", status: "DONE", priceCentsSnapshot: 10000, professionalId: "p1" },
    { id: "a2", status: "SCHEDULED", priceCentsSnapshot: 5000, professionalId: "p1" },
  ];

  it("ON_PAYMENT: só considera atendimentos DONE com recebimento", () => {
    const txs: TransactionFact[] = [tx({ id: "t1", appointmentId: "a1", amountCents: 10000 })];
    const items = apurarComissoesDoPeriodo("ON_PAYMENT", appointments, txs, 40);
    expect(items).toHaveLength(1);
    expect(items[0].commissionAmountCents).toBe(4000);
  });

  it("ON_PAYMENT: comissão deriva do recebido, não do devido — desconto é absorvido automaticamente", () => {
    const txs: TransactionFact[] = [tx({ id: "t1", appointmentId: "a1", amountCents: 8000 })]; // desconto de 2000
    const items = apurarComissoesDoPeriodo("ON_PAYMENT", appointments, txs, 40);
    expect(items[0].commissionAmountCents).toBe(3200); // 40% de 8000, não de 10000
  });

  it("ignora Transaction já estornada", () => {
    const txs: TransactionFact[] = [
      tx({ id: "t1", appointmentId: "a1", amountCents: 10000 }),
      tx({ id: "t2", appointmentId: "a1", type: "EXPENSE", amountCents: 10000, reversalOfId: "t1" }),
    ];
    expect(apurarComissoesDoPeriodo("ON_PAYMENT", appointments, txs, 40)).toHaveLength(0);
  });

  it("ON_COMPLETION lança erro explícito — reservada, não implementação parcial silenciosa", () => {
    expect(() => apurarComissoesDoPeriodo("ON_COMPLETION", appointments, [], 40)).toThrow();
  });
});

describe("totalPayout — Derived Over Stored", () => {
  it("soma os items, nunca lê campo separado", () => {
    const items = [
      { appointmentId: "a1", transactionId: "t1", baseAmountCents: 10000, commissionAmountCents: 4000 },
      { appointmentId: "a2", transactionId: "t2", baseAmountCents: 5000, commissionAmountCents: 2000 },
    ];
    expect(totalPayout(items)).toBe(6000);
  });
});

describe("diferencaFechamentoCaixa", () => {
  it("positivo quando sobra, negativo quando falta", () => {
    expect(diferencaFechamentoCaixa(10000, 10500)).toBe(500);
    expect(diferencaFechamentoCaixa(10000, 9800)).toBe(-200);
  });
});
