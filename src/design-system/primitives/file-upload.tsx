"use client";

import * as React from "react";
import { File as FileIcon, X, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "../lib/cn";
import { useUploadEngine } from "./_use-upload-engine";
import { Dropzone } from "./dropzone";
import { IconButton } from "./icon-button";
import type { UploadTransport, UploadConstraints, UploadFile } from "./_upload-engine";

export interface FileUploadProps {
  transport: UploadTransport;
  constraints?: UploadConstraints;
  accept?: string;
  disabled?: boolean;
  className?: string;
  onFilesChange?: (files: UploadFile[]) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function FileUpload({ transport, constraints, accept, disabled, className, onFilesChange }: FileUploadProps) {
  const { engine, files, dragActive } = useUploadEngine({ transport, constraints });

  React.useEffect(() => onFilesChange?.(files), [files, onFilesChange]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Dropzone engine={engine} dragActive={dragActive} accept={accept} disabled={disabled} />
      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2.5"
            >
              <FileIcon className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{f.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-[var(--text-muted)]">{formatBytes(f.file.size)}</p>
                  {f.status === "uploading" && (
                    <div className="h-1 flex-1 max-w-[120px] rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--brand)] transition-[width] duration-[var(--dur-base)]"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  )}
                  {f.status === "error" && <p className="text-xs text-[var(--danger)]">{f.error}</p>}
                </div>
              </div>
              {f.status === "success" && <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" aria-hidden />}
              {f.status === "error" && (
                <>
                  <AlertCircle className="h-4 w-4 text-[var(--danger)] shrink-0" aria-hidden />
                  <IconButton aria-label="Tentar novamente" variant="default" size="sm" onClick={() => engine.retry(f.id)}>
                    <RotateCcw />
                  </IconButton>
                </>
              )}
              <IconButton aria-label="Remover arquivo" variant="default" size="sm" onClick={() => engine.remove(f.id)}>
                <X />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
