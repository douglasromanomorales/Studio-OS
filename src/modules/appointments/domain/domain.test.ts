import { describe, it, expect } from "vitest";
import { haColisaoDeHorario, atendimentoEmAndamento, podeConfirmar, podeCancelar, podeMarcarConcluido, podeMarcarNoShow } from "./specifications";

const h = (hour: number, min = 0) => new Date(2026, 6, 16, hour, min);

describe("haColisaoDeHorario — a única regra própria da Agenda", () => {
  const existentes = [
    { id: "a1", professionalId: "p1", startAt: h(10), endAt: h(11), status: "SCHEDULED" as const },
  ];

  it("detecta sobreposição parcial", () => {
    expect(haColisaoDeHorario({ professionalId: "p1", startAt: h(10, 30), endAt: h(11, 30) }, existentes)).toBe(true);
  });

  it("não detecta colisão em horário livre", () => {
    expect(haColisaoDeHorario({ professionalId: "p1", startAt: h(11), endAt: h(12) }, existentes)).toBe(false);
  });

  it("não considera colisão entre profissionais diferentes", () => {
    expect(haColisaoDeHorario({ professionalId: "p2", startAt: h(10, 30), endAt: h(11, 30) }, existentes)).toBe(false);
  });

  it("ignora appointment cancelado", () => {
    const comCancelado = [{ ...existentes[0], status: "CANCELED" as const }];
    expect(haColisaoDeHorario({ professionalId: "p1", startAt: h(10, 30), endAt: h(11, 30) }, comCancelado)).toBe(false);
  });

  it("exclui o próprio id (edição não colide consigo mesmo)", () => {
    expect(
      haColisaoDeHorario({ professionalId: "p1", startAt: h(10), endAt: h(11), excludeId: "a1" }, existentes)
    ).toBe(false);
  });
});

describe("atendimentoEmAndamento — substitui o estado IN_PROGRESS removido", () => {
  const appt = { status: "CONFIRMED", startAt: h(10), endAt: h(11) };

  it("verdadeiro durante o intervalo", () => {
    expect(atendimentoEmAndamento(appt, h(10, 30))).toBe(true);
  });

  it("falso antes ou depois", () => {
    expect(atendimentoEmAndamento(appt, h(9, 30))).toBe(false);
    expect(atendimentoEmAndamento(appt, h(11, 30))).toBe(false);
  });

  it("falso se não estiver CONFIRMED, mesmo dentro do horário", () => {
    expect(atendimentoEmAndamento({ ...appt, status: "SCHEDULED" }, h(10, 30))).toBe(false);
  });
});

describe("guardas de transição", () => {
  it("só SCHEDULED pode confirmar", () => {
    expect(podeConfirmar("SCHEDULED")).toBe(true);
    expect(podeConfirmar("CONFIRMED")).toBe(false);
  });
  it("SCHEDULED e CONFIRMED podem cancelar", () => {
    expect(podeCancelar("SCHEDULED")).toBe(true);
    expect(podeCancelar("CONFIRMED")).toBe(true);
    expect(podeCancelar("DONE")).toBe(false);
  });
  it("só CONFIRMED pode virar DONE ou NO_SHOW", () => {
    expect(podeMarcarConcluido("CONFIRMED")).toBe(true);
    expect(podeMarcarConcluido("SCHEDULED")).toBe(false);
    expect(podeMarcarNoShow("CONFIRMED")).toBe(true);
  });
});
