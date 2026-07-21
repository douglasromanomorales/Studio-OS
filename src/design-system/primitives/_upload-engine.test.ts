import { describe, it, expect, vi } from "vitest";
import { UploadEngine, type UploadTransport } from "./_upload-engine";

function makeFile(name: string, sizeBytes: number, type = "image/png"): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("UploadEngine — validação", () => {
  it("rejeita arquivo acima do limite de tamanho", () => {
    const engine = new UploadEngine({
      transport: async () => ({}),
      constraints: { maxSizeBytes: 1_000_000 },
    });
    const { accepted, rejected } = engine.addFiles([makeFile("foto.png", 2_000_000)]);
    expect(accepted).toHaveLength(0);
    expect(rejected[0].reason).toMatch(/excede o limite/);
  });

  it("rejeita tipo fora do accept", () => {
    const engine = new UploadEngine({ transport: async () => ({}), constraints: { accept: ["image/*"] } });
    const { rejected } = engine.addFiles([makeFile("doc.pdf", 100, "application/pdf")]);
    expect(rejected[0].reason).toBe("Tipo de arquivo não permitido");
  });

  it("aceita dentro do accept com wildcard", () => {
    const engine = new UploadEngine({ transport: async () => ({}), constraints: { accept: ["image/*"] } });
    const { accepted } = engine.addFiles([makeFile("foto.jpg", 100, "image/jpeg")]);
    expect(accepted).toHaveLength(1);
  });

  it("respeita maxFiles", () => {
    const engine = new UploadEngine({ transport: async () => ({}), constraints: { maxFiles: 1 } });
    engine.addFiles([makeFile("a.png", 10)]);
    const { rejected } = engine.addFiles([makeFile("b.png", 10)]);
    expect(rejected[0].reason).toMatch(/Limite de 1/);
  });
});

describe("UploadEngine — ciclo de vida com transporte mockado", () => {
  it("transiciona pending -> uploading -> success", async () => {
    const transport: UploadTransport = async (_file, onProgress) => {
      onProgress(50);
      onProgress(100);
      return { url: "https://fake/foto.png" };
    };
    const engine = new UploadEngine({ transport });
    const listener = vi.fn();
    engine.subscribe(listener);

    engine.addFiles([makeFile("foto.png", 10)]);
    await new Promise((r) => setTimeout(r, 0));

    const [file] = engine.getSnapshot().files;
    expect(file.status).toBe("success");
    expect(file.progress).toBe(100);
    expect(listener).toHaveBeenCalled();
  });

  it("marca como error quando o transporte rejeita", async () => {
    const transport: UploadTransport = async () => {
      throw new Error("Falha de rede simulada");
    };
    const engine = new UploadEngine({ transport });
    engine.addFiles([makeFile("foto.png", 10)]);
    await new Promise((r) => setTimeout(r, 0));

    const [file] = engine.getSnapshot().files;
    expect(file.status).toBe("error");
    expect(file.error).toBe("Falha de rede simulada");
  });

  it("retry reenvia um arquivo com erro", async () => {
    let attempt = 0;
    const transport: UploadTransport = async () => {
      attempt++;
      if (attempt === 1) throw new Error("primeira tentativa falha");
      return { ok: true };
    };
    const engine = new UploadEngine({ transport });
    engine.addFiles([makeFile("foto.png", 10)]);
    await new Promise((r) => setTimeout(r, 0));
    expect(engine.getSnapshot().files[0].status).toBe("error");

    engine.retry(engine.getSnapshot().files[0].id);
    await new Promise((r) => setTimeout(r, 0));
    expect(engine.getSnapshot().files[0].status).toBe("success");
  });

  it("respeita o limite de concorrência", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const transport: UploadTransport = async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 10));
      concurrent--;
      return {};
    };
    const engine = new UploadEngine({ transport, concurrency: 2 });
    engine.addFiles([makeFile("a.png", 1), makeFile("b.png", 1), makeFile("c.png", 1), makeFile("d.png", 1)]);
    await new Promise((r) => setTimeout(r, 50));
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it("remove cancela o upload em andamento", async () => {
    const abortSpy = vi.fn();
    const transport: UploadTransport = (_file, _onProgress, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          abortSpy();
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    const engine = new UploadEngine({ transport });
    engine.addFiles([makeFile("foto.png", 10)]);
    const id = engine.getSnapshot().files[0].id;
    engine.remove(id);
    expect(abortSpy).toHaveBeenCalled();
    expect(engine.getSnapshot().files).toHaveLength(0);
  });
});
