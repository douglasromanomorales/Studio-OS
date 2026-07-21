/**
 * Upload Engine — comportamento puro. Não importa React, não sabe o que é JSX, não
 * conhece Tailwind nem tema. Testável inteiramente com `new UploadEngine(...)` e
 * arquivos File mockados, sem nenhum framework de renderização — se algum dia isso
 * deixar de ser verdade, é sinal de que responsabilidade de UI vazou para cá.
 *
 * O transporte real (para onde o arquivo é enviado) é injetado, não hardcoded — a
 * engine não sabe se o destino é Supabase Storage, S3 ou um mock de teste. Isso é
 * o que permite reutilizá-la em qualquer produto CodeChain sem acoplar a engine a
 * uma infraestrutura específica do Studio OS.
 */

export type UploadStatus = "pending" | "uploading" | "success" | "error" | "canceled";

export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  result?: unknown;
}

export interface UploadConstraints {
  maxSizeBytes?: number;
  /** Padrões tipo "image/*", ".pdf", "application/pdf". */
  accept?: string[];
  maxFiles?: number;
}

export type UploadTransport = (
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal
) => Promise<unknown>;

export interface UploadEngineOptions {
  transport: UploadTransport;
  constraints?: UploadConstraints;
  /** Uploads simultâneos — o resto fica em fila (`pending`). */
  concurrency?: number;
}

type Listener = () => void;

function generateId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export class UploadEngine {
  private files: UploadFile[] = [];
  private dragActive = false;
  private listeners = new Set<Listener>();
  private controllers = new Map<string, AbortController>();
  private activeCount = 0;

  private readonly transport: UploadTransport;
  private readonly constraints: UploadConstraints;
  private readonly concurrency: number;

  constructor({ transport, constraints = {}, concurrency = 3 }: UploadEngineOptions) {
    this.transport = transport;
    this.constraints = constraints;
    this.concurrency = concurrency;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  getSnapshot() {
    return { files: this.files, dragActive: this.dragActive };
  }

  /** Regra pura, sem efeito colateral — testável isoladamente com um File mockado. */
  validate(file: File): string | null {
    const { maxSizeBytes, accept } = this.constraints;
    if (maxSizeBytes && file.size > maxSizeBytes) {
      return `Arquivo excede o limite de ${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB`;
    }
    if (accept?.length) {
      const ok = accept.some((pattern) =>
        pattern.endsWith("/*")
          ? file.type.startsWith(pattern.replace("/*", "/"))
          : pattern.startsWith(".")
            ? file.name.toLowerCase().endsWith(pattern.toLowerCase())
            : file.type === pattern
      );
      if (!ok) return "Tipo de arquivo não permitido";
    }
    return null;
  }

  addFiles(incoming: File[]): { accepted: UploadFile[]; rejected: { file: File; reason: string }[] } {
    const { maxFiles } = this.constraints;
    const accepted: UploadFile[] = [];
    const rejected: { file: File; reason: string }[] = [];

    for (const file of incoming) {
      if (maxFiles && this.files.length + accepted.length >= maxFiles) {
        rejected.push({ file, reason: `Limite de ${maxFiles} arquivo(s) atingido` });
        continue;
      }
      const error = this.validate(file);
      if (error) {
        rejected.push({ file, reason: error });
        continue;
      }
      accepted.push({ id: generateId(), file, status: "pending", progress: 0 });
    }

    if (accepted.length) {
      this.files = [...this.files, ...accepted];
      this.emit();
      this.processQueue();
    }
    return { accepted, rejected };
  }

  private processQueue() {
    while (this.activeCount < this.concurrency) {
      const next = this.files.find((f) => f.status === "pending");
      if (!next) return;
      this.activeCount++;
      this.runUpload(next.id);
    }
  }

  private async runUpload(id: string) {
    const controller = new AbortController();
    this.controllers.set(id, controller);
    this.patch(id, { status: "uploading", progress: 0, error: undefined });

    try {
      const target = this.files.find((f) => f.id === id);
      if (!target) return;
      const result = await this.transport(target.file, (pct) => this.patch(id, { progress: pct }), controller.signal);
      this.patch(id, { status: "success", progress: 100, result });
    } catch (err) {
      this.patch(id, controller.signal.aborted ? { status: "canceled" } : { status: "error", error: err instanceof Error ? err.message : "Falha no envio" });
    } finally {
      this.controllers.delete(id);
      this.activeCount--;
      this.processQueue();
    }
  }

  private patch(id: string, changes: Partial<UploadFile>) {
    this.files = this.files.map((f) => (f.id === id ? { ...f, ...changes } : f));
    this.emit();
  }

  retry(id: string) {
    const file = this.files.find((f) => f.id === id);
    if (!file || (file.status !== "error" && file.status !== "canceled")) return;
    this.patch(id, { status: "pending", error: undefined, progress: 0 });
    this.processQueue();
  }

  cancel(id: string) {
    this.controllers.get(id)?.abort();
  }

  remove(id: string) {
    this.controllers.get(id)?.abort();
    this.controllers.delete(id);
    this.files = this.files.filter((f) => f.id !== id);
    this.emit();
  }

  setDragActive(active: boolean) {
    if (this.dragActive === active) return;
    this.dragActive = active;
    this.emit();
  }
}
