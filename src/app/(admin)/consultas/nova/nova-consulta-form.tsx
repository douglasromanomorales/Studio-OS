"use client";

import * as React from "react";
import { Field } from "@/design-system/primitives/field";
import { Textarea } from "@/design-system/primitives/textarea";
import { Combobox, type ComboboxOption } from "@/design-system/primitives/combobox";
import { MultiSelect } from "@/design-system/primitives/multi-select";
import { SwitchField } from "@/design-system/primitives/switch";
import { DatePicker } from "@/design-system/primitives/date-picker";
import { ImageUpload } from "@/design-system/primitives/image-upload";
import { Button } from "@/design-system/primitives/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/design-system/primitives/card";
import { Badge } from "@/design-system/primitives/badge";
import { consultaSchema, requiresStrandTest } from "@/lib/validations/consulta";
import { createConsultaAction } from "./actions";

interface NovaConsultaFormProps {
  customers: ComboboxOption[];
  services: ComboboxOption[];
  chemicalServiceIds: string[];
  onSearchCustomer: (query: string) => void;
  onCreateCustomer: () => void;
}

export function NovaConsultaForm({
  customers,
  services,
  chemicalServiceIds,
  onSearchCustomer,
  onCreateCustomer,
}: NovaConsultaFormProps) {
  const [customerId, setCustomerId] = React.useState("");
  const [jaFezQuimica, setJaFezQuimica] = React.useState(false);
  const [dataUltimoProcedimento, setDataUltimoProcedimento] = React.useState<Date | undefined>();
  const [alergiaConhecida, setAlergiaConhecida] = React.useState(false);
  const [observacoesHistorico, setObservacoesHistorico] = React.useState("");
  const [objetivoCliente, setObjetivoCliente] = React.useState("");
  const [interestedServiceIds, setInterestedServiceIds] = React.useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const needsStrandTest = requiresStrandTest({ jaFezQuimica, interestedServiceIds }, chemicalServiceIds);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = consultaSchema.safeParse({
      customerId,
      origin: "ADMIN",
      jaFezQuimica,
      dataUltimoProcedimento,
      alergiaConhecida,
      observacoesHistorico,
      objetivoCliente,
      interestedServiceIds,
      photoUrls,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await createConsultaAction({ ...result.data, precisaTesteMechas: needsStrandTest });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Cliente</CardTitle>
            <CardDescription>Busque um cliente existente ou cadastre um novo a partir daqui.</CardDescription>
          </div>
        </CardHeader>
        <Field label="Cliente" htmlFor="customer" required error={errors.customerId}>
          <Combobox
            id="customer"
            options={customers}
            value={customerId}
            onValueChange={setCustomerId}
            onSearch={onSearchCustomer}
            placeholder="Buscar por nome ou telefone..."
            renderEmpty={() => (
              <div className="flex flex-col items-center gap-2 py-2">
                <span>Nenhum cliente encontrado.</span>
                <Button type="button" variant="outline" size="sm" onClick={onCreateCustomer}>
                  Cadastrar novo cliente
                </Button>
              </div>
            )}
          />
        </Field>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Histórico químico</CardTitle>
            <CardDescription>Determina se o Teste de Mechas é obrigatório antes da avaliação.</CardDescription>
          </div>
        </CardHeader>
        <div className="flex flex-col gap-5">
          <SwitchField
            label="Já fez química conosco antes"
            description="Se não, e o interesse envolver coloração, o Teste de Mechas será exigido."
            checked={jaFezQuimica}
            onCheckedChange={setJaFezQuimica}
          />
          {jaFezQuimica && (
            <Field label="Data do último procedimento" htmlFor="lastProc">
              <DatePicker id="lastProc" value={dataUltimoProcedimento} onValueChange={setDataUltimoProcedimento} />
            </Field>
          )}
          <SwitchField
            label="Alergia conhecida a produtos químicos"
            checked={alergiaConhecida}
            onCheckedChange={setAlergiaConhecida}
          />
          <Field label="Observações do histórico" htmlFor="historico" hint="Opcional — qualquer detalhe relevante para a avaliação.">
            <Textarea
              id="historico"
              value={observacoesHistorico}
              onChange={(e) => setObservacoesHistorico(e.target.value)}
              placeholder="Ex: descoloração há 3 meses em outro salão..."
            />
          </Field>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Objetivo da cliente</CardTitle>
            <CardDescription>O que ela quer alcançar e quais serviços têm interesse.</CardDescription>
          </div>
        </CardHeader>
        <div className="flex flex-col gap-5">
          <Field label="Descrição do objetivo" htmlFor="objetivo" required error={errors.objetivoCliente}>
            <Textarea
              id="objetivo"
              value={objetivoCliente}
              onChange={(e) => setObjetivoCliente(e.target.value)}
              placeholder="Ex: quer loiro platinado, hoje é castanho médio, nunca descoloriu..."
            />
          </Field>
          <Field label="Serviços de interesse" htmlFor="services" required error={errors.interestedServiceIds}>
            <MultiSelect
              id="services"
              options={services}
              values={interestedServiceIds}
              onValuesChange={setInterestedServiceIds}
              placeholder="Selecionar serviços..."
            />
          </Field>
          {needsStrandTest && (
            <Badge variant="warning" dot>
              Teste de Mechas será exigido antes da aprovação
            </Badge>
          )}
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Fotos</CardTitle>
            <CardDescription>Foto atual do cabelo — obrigatória se não houver histórico químico conosco.</CardDescription>
          </div>
        </CardHeader>
        <ImageUpload
          transport={mockTransport}
          constraints={{ maxSizeBytes: 5 * 1024 * 1024, maxFiles: 6 }}
          onFilesChange={(files) =>
            setPhotoUrls(files.filter((f) => f.status === "success").map((f) => (f.result as { url: string }).url))
          }
        />
        {errors.photoUrls && <p role="alert" className="text-xs text-[var(--danger)] mt-2">{errors.photoUrls}</p>}
      </Card>

      <CardFooter className="border-none pt-0 mt-0 max-w-2xl">
        <Button type="button" variant="ghost">Cancelar</Button>
        <Button type="submit" loading={submitting}>Criar consulta</Button>
      </CardFooter>
    </form>
  );
}

// Placeholder de transporte — troca por upload real ao Supabase Storage quando a
// integração de storage entrar no roadmap. A engine não sabe a diferença.
async function mockTransport(file: File, onProgress: (pct: number) => void) {
  onProgress(50);
  await new Promise((r) => setTimeout(r, 400));
  onProgress(100);
  return { url: URL.createObjectURL(file) };
}
