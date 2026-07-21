"use client";

import * as React from "react";
import { X, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "../lib/cn";
import { useUploadEngine } from "./_use-upload-engine";
import { Dropzone } from "./dropzone";
import { IconButton } from "./icon-button";
import { Spinner } from "./divider-spinner";
import type { UploadTransport, UploadConstraints, UploadFile } from "./_upload-engine";

export interface ImageUploadProps {
  transport: UploadTransport;
  constraints?: UploadConstraints;
  disabled?: boolean;
  className?: string;
  onFilesChange?: (files: UploadFile[]) => void;
}

/**
 * Mesma engine do FileUpload — a única diferença é a apresentação (grade de
 * miniaturas via URL.createObjectURL em vez de lista com ícone genérico). Nenhuma
 * lógica de fila/progresso/retry é reimplementada aqui.
 */
export function ImageUpload({ transport, constraints, disabled, className, onFilesChange }: ImageUploadProps) {
  const { engine, files, dragActive } = useUploadEngine({
    transport,
    constraints: { accept: ["image/*"], ...constraints },
  });

  React.useEffect(() => onFilesChange?.(files), [files, onFilesChange]);

  const previews = React.useMemo(
    () => new Map(files.map((f) => [f.id, URL.createObjectURL(f.file)])),
    [files]
  );
  React.useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Dropzone engine={engine} dragActive={dragActive} accept="image/*" disabled={disabled}>
        <p className="text-sm text-[var(--text-secondary)]">
          Arraste fotos aqui ou <span className="text-[var(--brand)] font-medium">clique para selecionar</span>
        </p>
      </Dropzone>

      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {files.map((f) => (
            <div key={f.id} className="relative aspect-square rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border)]">
              <img src={previews.get(f.id)} alt="" className="h-full w-full object-cover" />
              {f.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-overlay)]">
                  <Spinner size="sm" />
                </div>
              )}
              {f.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--surface-overlay)]">
                  <AlertCircle className="h-4 w-4 text-white" aria-hidden />
                  <IconButton aria-label="Tentar novamente" variant="solid" size="sm" onClick={() => engine.retry(f.id)}>
                    <RotateCcw />
                  </IconButton>
                </div>
              )}
              <IconButton
                aria-label="Remover foto"
                variant="solid"
                size="sm"
                onClick={() => engine.remove(f.id)}
                className="absolute top-1.5 right-1.5 h-6 w-6 [&_svg]:h-3.5 [&_svg]:w-3.5"
              >
                <X />
              </IconButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
