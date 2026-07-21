"use client";

import * as React from "react";
import { cn } from "@/design-system/lib/cn";
import { EmptyState } from "@/design-system/primitives/empty-state";
import { Skeleton } from "@/design-system/primitives/skeleton";
import { toast } from "@/design-system/primitives/toast";
import { useMediaQuery } from "@/design-system/primitives/use-media-query";
import { interpretAgendaGridKey, clampPosition, type GridPosition } from "@/modules/appointments/domain/grid-navigation";
import { listarAppointmentsDoDiaAction, remarcarAppointmentAction, ajustarDuracaoAppointmentAction, type AppointmentListItem } from "./actions";
import { NovoAppointmentQuickCreate } from "./novo-appointment-quick-create";
import { AppointmentSheet } from "./appointment-sheet";
import { AgendaMobileList } from "./agenda-mobile-list";

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 32;
const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
const TOTAL_ROWS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;

const STATUS_LABEL_PT: Record<string, string> = {
  SCHEDULED: "agendado",
  CONFIRMED: "confirmado",
  DONE: "concluído",
  NO_SHOW: "não compareceu",
  CANCELED: "cancelado",
};

function slotLabel(row: number) {
  const totalMin = row * SLOT_MINUTES;
  const h = START_HOUR + Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dateForRow(base: Date, row: number): Date {
  const d = new Date(base);
  d.setHours(START_HOUR, 0, 0, 0);
  d.setMinutes(d.getMinutes() + row * SLOT_MINUTES);
  return d;
}

function rowForDate(date: Date): number {
  const minutesFromStart = (date.getHours() - START_HOUR) * 60 + date.getMinutes();
  return Math.round(minutesFromStart / SLOT_MINUTES);
}

export interface AgendaGridProps {
  profissionais: { id: string; name: string; color: string }[];
}

export function AgendaGrid({ profissionais }: AgendaGridProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [loading, setLoading] = React.useState(true);
  const [appointments, setAppointments] = React.useState<AppointmentListItem[]>([]);
  const [focused, setFocused] = React.useState<GridPosition>({ row: 0, col: 0 });
  const [announce, setAnnounce] = React.useState("");
  const [createSlot, setCreateSlot] = React.useState<{ professionalId: string; startAt: Date } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = React.useState<AppointmentListItem | null>(null);
  const [dragState, setDragState] = React.useState<{ id: string; mode: "move" | "resize"; startY: number; originalStartRow: number; deltaRows: number } | null>(null);
  const today = React.useMemo(() => new Date(), []);
  const cellRefs = React.useRef(new Map<string, HTMLDivElement>());
  const shouldRefocus = React.useRef(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const data = await listarAppointmentsDoDiaAction(today);
    setAppointments(data);
    setLoading(false);
  }, [today]);

  React.useEffect(() => {
    load();
  }, [load]);

  const maxCol = profissionais.length - 1;

  // Roving tabindex real — mesma técnica de _calendar-grid: DOM focus se move de
  // verdade via ref + .focus(), não só um anel visual (achado de acessibilidade
  // corrigido nesta rodada, ver Interaction Readiness).
  React.useEffect(() => {
    if (!shouldRefocus.current) return;
    shouldRefocus.current = false;
    cellRefs.current.get(`${focused.row}-${focused.col}`)?.focus();
  }, [focused]);

  function appointmentAt(row: number, col: number) {
    const prof = profissionais[col];
    return appointments.find((a) => a.professionalId === prof?.id && rowForDate(a.startAt) === row);
  }

  function announceCell(pos: GridPosition) {
    const prof = profissionais[pos.col];
    const appt = appointmentAt(pos.row, pos.col);
    if (!prof) return;
    if (appt) {
      setAnnounce(`${appt.customerName}, ${appt.serviceName}, ${STATUS_LABEL_PT[appt.status]}, ${slotLabel(pos.row)} com ${prof.name}`);
    } else {
      setAnnounce(`Horário livre, ${slotLabel(pos.row)}, ${prof.name}`);
    }
  }

  function handleGridKeyDown(e: React.KeyboardEvent) {
    const action = interpretAgendaGridKey(e.key);
    if (!action) return;
    e.preventDefault();
    if (action.type === "select") {
      const appt = appointmentAt(focused.row, focused.col);
      if (appt) {
        setSelectedAppointment(appt);
        return;
      }
      const prof = profissionais[focused.col];
      if (prof) setCreateSlot({ professionalId: prof.id, startAt: dateForRow(today, focused.row) });
      return;
    }
    const next = clampPosition({ row: focused.row + (action.row ?? 0), col: focused.col + (action.col ?? 0) }, TOTAL_ROWS - 1, maxCol);
    shouldRefocus.current = true;
    setFocused(next);
    announceCell(next);
  }

  function handlePointerDownCard(e: React.PointerEvent, appt: AppointmentListItem, mode: "move" | "resize") {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({ id: appt.id, mode, startY: e.clientY, originalStartRow: rowForDate(appt.startAt), deltaRows: 0 });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState) return;
    const deltaPx = e.clientY - dragState.startY;
    const deltaRows = Math.round(deltaPx / SLOT_HEIGHT);
    setDragState((prev) => (prev ? { ...prev, deltaRows } : prev));
  }

  async function handlePointerUp() {
    if (!dragState) return;
    const appt = appointments.find((a) => a.id === dragState.id);
    setDragState(null);
    if (!appt || dragState.deltaRows === 0) return;

    if (dragState.mode === "move") {
      const novoStartAt = dateForRow(today, clampPosition({ row: dragState.originalStartRow + dragState.deltaRows, col: 0 }, TOTAL_ROWS - 1, 0).row);
      const result = await remarcarAppointmentAction(appt.id, novoStartAt);
      if (!result.ok) return toast.error("Não foi possível remarcar", result.error);
      toast.success("Agendamento remarcado");
      load();
    } else {
      const durationMin = (appt.endAt.getTime() - appt.startAt.getTime()) / 60000 + dragState.deltaRows * SLOT_MINUTES;
      if (durationMin < SLOT_MINUTES) return;
      const result = await ajustarDuracaoAppointmentAction(appt.id, durationMin);
      if (!result.ok) return toast.error("Não foi possível redimensionar", result.error);
      toast.success("Duração ajustada");
      load();
    }
  }

  if (loading) {
    return (
      <div className="px-8 pb-8 flex-1 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  if (profissionais.length === 0) {
    return (
      <EmptyState
        title="Nenhuma profissional com grade configurada"
        description="Configure a grade de horários de uma profissional para começar a agendar."
      />
    );
  }

  // Mobile Capable, não Mobile First: abaixo do breakpoint, grade vira lista —
  // sem drag-and-drop, ações diretas (Design Language, cap. 6.1 + Blueprint seção 7).
  if (isMobile) {
    return (
      <AgendaMobileList
        appointments={appointments}
        onOpen={setSelectedAppointment}
        onChanged={load}
      />
    );
  }

  return (
    <div className="px-8 pb-8 flex-1 overflow-y-auto" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      <div
        role="grid"
        aria-label={`Agenda de hoje, ${today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}`}
        className="grid border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden"
        style={{ gridTemplateColumns: `64px repeat(${profissionais.length}, 1fr)` }}
      >
        <div className="bg-[var(--surface-sunken)] border-b border-[var(--border)]" />
        {profissionais.map((p) => (
          <div key={p.id} role="columnheader" className="bg-[var(--surface-sunken)] border-b border-l border-[var(--border)] px-3 py-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} aria-hidden />
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{p.name}</span>
          </div>
        ))}

        {Array.from({ length: TOTAL_ROWS }).map((_, row) => (
          <React.Fragment key={row}>
            <div role="rowheader" className="text-xs text-[var(--text-muted)] text-right pr-2 border-b border-[var(--border)]" style={{ height: SLOT_HEIGHT }}>
              {row % SLOTS_PER_HOUR === 0 ? slotLabel(row) : ""}
            </div>
            {profissionais.map((p, col) => {
              const isRovingTarget = focused.row === row && focused.col === col;
              const apptHere = appointmentAt(row, col);
              const cellKey = `${row}-${col}`;
              return (
                <div
                  key={p.id}
                  ref={(el) => {
                    if (el) cellRefs.current.set(cellKey, el);
                    else cellRefs.current.delete(cellKey);
                  }}
                  role="gridcell"
                  tabIndex={isRovingTarget ? 0 : -1}
                  aria-label={
                    apptHere
                      ? `${apptHere.customerName}, ${apptHere.serviceName}, ${STATUS_LABEL_PT[apptHere.status]}, ${slotLabel(row)} às ${apptHere.endAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} com ${p.name}`
                      : `Horário livre, ${slotLabel(row)}, ${p.name}. Pressione Enter para agendar.`
                  }
                  onFocus={() => setFocused({ row, col })}
                  onKeyDown={handleGridKeyDown}
                  onClick={() => {
                    setFocused({ row, col });
                    if (apptHere) setSelectedAppointment(apptHere);
                    else setCreateSlot({ professionalId: p.id, startAt: dateForRow(today, row) });
                  }}
                  className={cn(
                    "relative border-b border-l border-[var(--border)] cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]",
                    isRovingTarget && "ring-2 ring-inset ring-[var(--brand)]"
                  )}
                  style={{ height: SLOT_HEIGHT }}
                >
                  {apptHere && (
                    <AppointmentCard
                      appt={apptHere}
                      slotHeight={SLOT_HEIGHT}
                      slotMinutes={SLOT_MINUTES}
                      dragState={dragState?.id === apptHere.id ? dragState : null}
                      onPointerDownMove={(e) => handlePointerDownCard(e, apptHere, "move")}
                      onPointerDownResize={(e) => handlePointerDownCard(e, apptHere, "resize")}
                    />
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {createSlot && (
        <NovoAppointmentQuickCreate
          professionalId={createSlot.professionalId}
          startAt={createSlot.startAt}
          onOpenChange={(open) => !open && setCreateSlot(null)}
          onCreated={() => {
            setCreateSlot(null);
            load();
          }}
        />
      )}

      {selectedAppointment && (
        <AppointmentSheet
          appointment={selectedAppointment}
          onOpenChange={(open) => !open && setSelectedAppointment(null)}
          onChanged={() => {
            setSelectedAppointment(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/** Puramente apresentacional — aria-label real vive na célula-pai (role="gridcell"), evita duplicar anúncio. */
function AppointmentCard({
  appt,
  slotHeight,
  slotMinutes,
  dragState,
  onPointerDownMove,
  onPointerDownResize,
}: {
  appt: AppointmentListItem;
  slotHeight: number;
  slotMinutes: number;
  dragState: { mode: "move" | "resize"; deltaRows: number } | null;
  onPointerDownMove: (e: React.PointerEvent) => void;
  onPointerDownResize: (e: React.PointerEvent) => void;
}) {
  const durationMin = (appt.endAt.getTime() - appt.startAt.getTime()) / 60000;
  const slots = Math.max(1, durationMin / slotMinutes);
  const height = slots * slotHeight + (slots - 1);
  const dragOffset = dragState?.mode === "move" ? dragState.deltaRows * slotHeight : 0;
  const resizeExtra = dragState?.mode === "resize" ? dragState.deltaRows * slotHeight : 0;

  return (
    <div
      aria-hidden
      onPointerDown={onPointerDownMove}
      className={cn(
        "absolute left-0.5 right-0.5 top-0 rounded-[var(--radius-xs)] px-2 py-1 text-xs text-white cursor-grab active:cursor-grabbing overflow-hidden",
        "transition-shadow duration-[var(--dur-fast)]",
        appt.status === "CANCELED" && "opacity-40 line-through"
      )}
      style={{
        height: height + resizeExtra,
        background: appt.professionalColor,
        border: appt.status === "CONFIRMED" ? "2px solid rgba(255,255,255,.7)" : "2px dashed rgba(255,255,255,.5)",
        transform: `translateY(${dragOffset}px)`,
        zIndex: dragState ? 10 : 1,
      }}
    >
      <p className="font-medium truncate">{appt.customerName}</p>
      <p className="opacity-85 truncate">{appt.serviceName}</p>
      <div
        aria-hidden
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDownResize(e);
        }}
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize"
      />
    </div>
  );
}
