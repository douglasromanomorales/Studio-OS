"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "../lib/cn";
import type { UploadEngine } from "./_upload-engine";

export interface DropzoneProps {
  engine: UploadEngine;
  dragActive: boolean;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Dropzone é a área de destino do drag-and-drop em si — nada mais. FileUpload e
 * ImageUpload a compõem; ela também pode ser usada sozinha (ex: importação de CSV
 * em um módulo futuro que só precisa de "solte um arquivo aqui", sem lista/preview).
 */
export function Dropzone({ engine, dragActive, accept, multiple = true, disabled, className, children }: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    engine.addFiles(Array.from(fileList));
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!disabled) engine.setDragActive(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        engine.setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        engine.setDragActive(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed p-8 text-center cursor-pointer",
        "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-product)]",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        dragActive ? "border-[var(--brand)] bg-[var(--brand-subtle)]" : "border-[var(--border-strong)]",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {children ?? (
        <>
          <UploadCloud className="h-6 w-6 text-[var(--text-muted)]" aria-hidden />
          <p className="text-sm text-[var(--text-secondary)]">
            Arraste arquivos aqui ou <span className="text-[var(--brand)] font-medium">clique para selecionar</span>
          </p>
        </>
      )}
    </div>
  );
}
