import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/cn";
import { IconButton } from "./icon-button";
import { Button } from "./button";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Quantas páginas mostrar antes de colapsar em "..." — padrão cobre a maioria dos casos sem virar barra infinita. */
  siblingCount?: number;
  className?: string;
}

function getVisiblePages(page: number, totalPages: number, siblingCount: number): (number | "ellipsis")[] {
  const totalVisible = siblingCount * 2 + 5; // primeira + última + atual + siblings de cada lado + 2 ellipsis
  if (totalPages <= totalVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const pages: (number | "ellipsis")[] = [1];
  if (left > 2) pages.push("ellipsis");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1, className }: PaginationProps) {
  const pages = getVisiblePages(page, totalPages, siblingCount);

  return (
    <nav aria-label="Paginação" className={cn("flex items-center gap-1", className)}>
      <IconButton aria-label="Página anterior" variant="default" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft />
      </IconButton>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="h-8 w-8 flex items-center justify-center text-[var(--text-muted)]" aria-hidden>
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Button
            key={p}
            size="sm"
            variant={p === page ? "primary" : "ghost"}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange(p)}
            className="h-8 w-8 px-0"
          >
            {p}
          </Button>
        )
      )}

      <IconButton
        aria-label="Próxima página"
        variant="default"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </IconButton>
    </nav>
  );
}
