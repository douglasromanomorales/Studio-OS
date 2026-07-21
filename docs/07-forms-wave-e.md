# CodeChain Design System — Onda 3e (Forms: Uploads)

## Processo aplicado

1. **Comportamento existe independente de interface?** Sim — fila, progresso, retry,
   validação e cancelamento não têm nenhuma opinião visual.
2. **Reutilizável em outro produto CodeChain?** Sim — Sofia IA anexando um documento
   de referência, CRM anexando contrato, qualquer produto futuro que precise enviar
   arquivo para armazenamento.
3. **Nasce como Engine primeiro.** `_upload-engine.ts` — zero import de React, zero
   JSX, zero CSS. `_use-upload-engine.ts` é o único ponto de contato com React
   (`useSyncExternalStore`), e a engine não sabe que esse arquivo existe — a
   dependência é sempre Engine ← Adapter.

---

## `_upload-engine.ts` (interno, headless)

Concentra fila, progresso, retry, cancelamento, validação de tipo/tamanho/quantidade
e estado de drag. O transporte real (para onde o arquivo vai) é **injetado** via
`UploadTransport` — a engine nunca importa `fetch`, nunca sabe o nome de um bucket do
Supabase. Isso é o que a torna testável sem servidor, sem rede real e sem UI:

```ts
// Exemplo do tipo de teste que a engine precisa suportar — sem React, sem DOM real,
// sem servidor. Só a lógica.
const engine = new UploadEngine({
  constraints: { maxSizeBytes: 1_000_000, accept: ["image/*"] },
  transport: async (file, onProgress) => {
    onProgress(50);
    onProgress(100);
    return { url: `https://fake/${file.name}` };
  },
});

const bigFile = new File([new Uint8Array(2_000_000)], "foto.png", { type: "image/png" });
const { rejected } = engine.addFiles([bigFile]);
// rejected[0].reason === "Arquivo excede o limite de 1.0MB"

const okFile = new File(["conteudo"], "foto.png", { type: "image/png" });
engine.addFiles([okFile]);
// engine.getSnapshot().files[0].status transita pending → uploading → success
```

Nenhuma dessas asserções depende de renderizar um componente — é exatamente o
critério da regra oficial ("se não for testável só com unit test, UI vazou para a
engine").

---

## Dropzone

**Problema que resolve:** área de destino de arraste-e-solte. É a unidade de UI mais
primitiva das três — só conecta eventos de DOM (`dragenter`/`drop`/input file) aos
métodos da engine (`setDragActive`, `addFiles`).

**Quando usar:** sozinho, quando não é preciso mostrar lista/preview (ex: um módulo
futuro de importação de CSV que só precisa de "solte o arquivo aqui" e processa
direto). Como base de `FileUpload`/`ImageUpload` no caso comum.

```tsx
<Dropzone engine={engine} dragActive={dragActive} accept=".csv" />
```

---

## FileUpload

**Problema que resolve:** upload de documentos com lista de progresso — anexos de
Consulta, documentos de fornecedor.

**Composição:** `Dropzone` + lista de arquivos com nome/tamanho/progresso/retry.
Nenhuma lógica de fila reimplementada.

```tsx
<FileUpload
  transport={uploadToSupabase}
  constraints={{ maxSizeBytes: 10 * 1024 * 1024, maxFiles: 5 }}
/>
```

---

## ImageUpload

**Problema que resolve:** upload de fotos com preview visual imediato — este é o
componente que vai atender diretamente o Prontuário (fotos antes/depois, mapeado na
descoberta operacional) e o avatar de cliente/profissional.

**Composição:** `Dropzone` + grade de miniaturas (`URL.createObjectURL` para preview
local instantâneo, antes mesmo do upload terminar). Mesma engine do `FileUpload` —
só a apresentação muda.

```tsx
<ImageUpload
  transport={uploadToSupabase}
  constraints={{ maxSizeBytes: 5 * 1024 * 1024, maxFiles: 8 }}
  onFilesChange={(files) => sincronizarComProntuario(files)}
/>
```

---

## Resultado da onda

Uma engine, três interfaces públicas (`Dropzone`, `FileUpload`, `ImageUpload`), um
adaptador interno (`_use-upload-engine.ts`) — exatamente a forma que a diretriz desta
rodada pedia: `_upload-engine → FileUpload → ImageUpload → Dropzone`, um motor,
múltiplas interfaces, nenhuma duplicação de fila/progresso/retry entre elas.

Isso fecha a Onda 3 inteira (3a–3e). `Filter Builder` permanece adiado — nenhum
módulo do roadmap chegou a defini-lo ainda.
