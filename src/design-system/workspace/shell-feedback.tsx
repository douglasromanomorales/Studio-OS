"use client";

import * as React from "react";
import { Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "../primitives/empty-state";
import { Button } from "../primitives/button";
import { Skeleton } from "../primitives/skeleton";

/**
 * Feedback Layer — Toast já vive em primitives/toast.tsx (é reutilizável fora do
 * Workspace). Aqui ficam as duas peças que são especificamente sobre o ciclo de vida
 * de uma página inteira dentro da Content Layer: erro não tratado e carregamento.
 */

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: (error: Error, reset: () => void) => React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: encaminhar para error tracking real (Sentry/similar) quando o pacote de
    // observabilidade nascer — ver Design Language, cap. 18.5. Por ora, console.
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <EmptyState
          icon={<AlertTriangle />}
          title="Algo deu errado"
          description="Não foi possível carregar esta página. Tente novamente — se persistir, a equipe já foi avisada."
          action={<Button variant="outline" onClick={this.reset}>Tentar novamente</Button>}
        />
      );
    }
    return this.props.children;
  }
}

/** Suspense com skeleton padrão do Workspace — evita cada módulo inventar o próprio fallback. */
export function LoadingBoundary({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <Suspense fallback={fallback ?? <DefaultPageSkeleton />}>{children}</Suspense>;
}

function DefaultPageSkeleton() {
  return (
    <div className="p-8 flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-3 gap-4 mt-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
