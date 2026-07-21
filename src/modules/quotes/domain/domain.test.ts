import { describe, it, expect } from "vitest";
import { addDays, subDays } from "date-fns";
import { valorTotal, duracaoEstimada, orcamentoExpirado, orcamentoAceito, prontoParaAgendamento, podeSerAprovadoOuRecusado } from "./specifications";

const item = (amountCents: number, durationMinutesSnapshot: number) => ({
  serviceId: "s1",
  serviceNameSnapshot: "Mechas",
  amountCents,
  durationMinutesSnapshot,
});

describe("Derived Over Stored — valorTotal e duracaoEstimada", () => {
  it("soma os itens, nunca lê um campo separado", () => {
    const items = [item(15000, 180), item(5000, 60)];
    expect(valorTotal(items)).toBe(20000);
    expect(duracaoEstimada(items)).toBe(240);
  });

  it("sem itens, zero — nunca undefined ou erro", () => {
    expect(valorTotal([])).toBe(0);
    expect(duracaoEstimada([])).toBe(0);
  });
});

describe("orcamentoExpirado — por que EXPIRADO não podia ser estado persistido", () => {
  const hoje = new Date(2026, 6, 16);

  it("ENVIADO com validade passada: expirado", () => {
    expect(orcamentoExpirado({ status: "ENVIADO", validoAte: subDays(hoje, 1) }, hoje)).toBe(true);
  });

  it("ENVIADO com validade futura: não expirado", () => {
    expect(orcamentoExpirado({ status: "ENVIADO", validoAte: addDays(hoje, 5) }, hoje)).toBe(false);
  });

  it("APROVADO nunca expira, mesmo com validoAte no passado — aceite é final no MVP", () => {
    expect(orcamentoExpirado({ status: "APROVADO", validoAte: subDays(hoje, 30) }, hoje)).toBe(false);
  });

  it("RASCUNHO nunca expira — nem chegou a ser proposto formalmente", () => {
    expect(orcamentoExpirado({ status: "RASCUNHO", validoAte: subDays(hoje, 30) }, hoje)).toBe(false);
  });
});

describe("orcamentoAceito / prontoParaAgendamento — o único contrato que a Agenda consome", () => {
  it("só APROVADO é aceito", () => {
    expect(orcamentoAceito({ status: "APROVADO", validoAte: null })).toBe(true);
    expect(orcamentoAceito({ status: "ENVIADO", validoAte: null })).toBe(false);
  });

  it("prontoParaAgendamento reflete a mesma resposta — Agenda não implementa lógica própria", () => {
    expect(prontoParaAgendamento({ status: "APROVADO", validoAte: null })).toBe(true);
  });
});

describe("podeSerAprovadoOuRecusado — regra de transição", () => {
  const hoje = new Date(2026, 6, 16);

  it("bloqueia a partir de RASCUNHO", () => {
    expect(podeSerAprovadoOuRecusado({ status: "RASCUNHO", validoAte: null }, hoje).pode).toBe(false);
  });

  it("bloqueia se expirado", () => {
    expect(podeSerAprovadoOuRecusado({ status: "ENVIADO", validoAte: subDays(hoje, 1) }, hoje).pode).toBe(false);
  });

  it("permite a partir de ENVIADO dentro da validade", () => {
    expect(podeSerAprovadoOuRecusado({ status: "ENVIADO", validoAte: addDays(hoje, 1) }, hoje).pode).toBe(true);
  });
});
