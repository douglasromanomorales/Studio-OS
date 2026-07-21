import { z } from "zod";

/**
 * Regra de negócio da descoberta operacional: cliente novo tentando mecha/coloração
 * sem histórico conhecido precisa do Teste de Mechas antes. Isso é validação de
 * domínio do Studio OS — não pertence à camada de design system (`src/design-system`), que nunca conhece "teste de
 * mechas". Fica aqui, dentro do módulo.
 */
export const consultaSchema = z
  .object({
    customerId: z.string().min(1, "Selecione ou cadastre um cliente"),
    origin: z.enum(["INSTAGRAM", "WHATSAPP", "PORTAL", "ADMIN"]),
    jaFezQuimica: z.boolean(),
    tipoUltimoProcedimento: z.string().optional(),
    dataUltimoProcedimento: z.date().optional(),
    alergiaConhecida: z.boolean(),
    observacoesHistorico: z.string().max(2000).optional(),
    objetivoCliente: z.string().min(10, "Descreva o objetivo com mais detalhe (mín. 10 caracteres)"),
    interestedServiceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço de interesse"),
    photoUrls: z.array(z.string()).default([]),
  })
  .refine(
    (data) => data.jaFezQuimica || data.photoUrls.length > 0,
    {
      message: "Cliente sem histórico químico conhecido precisa de ao menos uma foto atual para avaliação segura",
      path: ["photoUrls"],
    }
  );

export type ConsultaFormValues = z.infer<typeof consultaSchema>;

/** Deriva se o Teste de Mechas é obrigatório — não é uma escolha manual, é regra. */
export function requiresStrandTest(values: Pick<ConsultaFormValues, "jaFezQuimica" | "interestedServiceIds">, chemicalServiceIds: string[]) {
  const wantsChemicalService = values.interestedServiceIds.some((id) => chemicalServiceIds.includes(id));
  return wantsChemicalService && !values.jaFezQuimica;
}
