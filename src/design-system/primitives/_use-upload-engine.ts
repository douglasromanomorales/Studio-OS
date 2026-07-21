"use client";

import * as React from "react";
import { UploadEngine, type UploadEngineOptions } from "./_upload-engine";

/**
 * Único ponto de contato entre a Upload Engine (pura) e React. A engine não importa
 * este arquivo — a dependência é sempre Engine ← Adapter, nunca o contrário.
 * useSyncExternalStore é o hook correto para expor uma store externa (a engine já
 * gerencia seu próprio estado e notifica listeners) sem duplicar state em useState.
 */
export function useUploadEngine(options: UploadEngineOptions) {
  const engineRef = React.useRef<UploadEngine | null>(null);
  if (!engineRef.current) engineRef.current = new UploadEngine(options);
  const engine = engineRef.current;

 const snapshot = React.useSyncExternalStore(
  (listener) => engine.subscribe(listener),
  () => engine.getSnapshot(),
  () => engine.getSnapshot()
);
  return { engine, files: snapshot.files, dragActive: snapshot.dragActive };
}
