"use client";

import { useState } from "react";
import { Pencil, Plus, Repeat } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { MONTHS, usd } from "@/lib/finance";
import type { EventItem } from "@/types/finance";

interface Props {
  /** Todos los eventos del usuario (la sección filtra por año) */
  events: EventItem[];
  year: number;
  month: number;
  onAdd: () => void;
  onEdit: (event: EventItem) => void;
}

function daysUntil(year: number, month: number, day: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(year, month - 1, day);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function EventRow({ ev, year, onEdit }: { ev: EventItem; year: number; onEdit: (e: EventItem) => void }) {
  const diff = daysUntil(year, ev.event_month, ev.event_day);
  const when = diff === 0 ? "Hoy" : diff > 0 && diff <= 90 ? `en ${diff} ${diff === 1 ? "día" : "días"}` : null;
  const past = diff < 0;
  return (
    <li className={`flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-800/60 ${past ? "opacity-60" : ""}`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
        <Icon name={ev.icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-100">{ev.name}</p>
        <p className="truncate text-xs text-slate-400">
          {ev.event_day} de {MONTHS[ev.event_month - 1].toLowerCase()}
          {when && <span className="ml-2 font-bold text-amber-300">{when}</span>}
        </p>
      </div>
      {ev.year === null && (
        <span title="Se repite cada año" className="text-slate-500">
          <Repeat className="size-4" aria-hidden="true" />
          <span className="sr-only">Se repite cada año</span>
        </span>
      )}
      <span className="font-bold tabular-nums text-slate-100">{usd(ev.amount)}</span>
      <button
        type="button"
        onClick={() => onEdit(ev)}
        aria-label={`Editar evento ${ev.name}`}
        title="Editar"
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
      >
        <Pencil className="size-4" />
      </button>
    </li>
  );
}

export function EventsSection({ events, year, month, onAdd, onEdit }: Props) {
  const [view, setView] = useState<"mes" | "anio">("mes");

  const ofYear = events
    .filter((e) => e.year === null || e.year === year)
    .sort((a, b) => a.event_month - b.event_month || a.event_day - b.event_day);
  const ofMonth = ofYear.filter((e) => e.event_month === month);
  const shown = view === "mes" ? ofMonth : ofYear;
  const total = shown.reduce((s, e) => s + e.amount, 0);

  const tab = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
      active ? "bg-slate-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-100"
    }`;

  return (
    <section aria-label="Eventos" className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <Icon name="calendar-heart" className="size-5 text-amber-400" />
          Eventos
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-800 p-1" role="tablist" aria-label="Periodo de eventos">
            <button type="button" role="tab" aria-selected={view === "mes"} className={tab(view === "mes")} onClick={() => setView("mes")}>
              {MONTHS[month - 1]}
            </button>
            <button type="button" role="tab" aria-selected={view === "anio"} className={tab(view === "anio")} onClick={() => setView("anio")}>
              Todo {year}
            </button>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            <Plus className="size-4" aria-hidden="true" />
            Añadir evento
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-sm">
        <span className="font-medium text-amber-200/80">
          {view === "mes" ? `Necesitas para eventos en ${MONTHS[month - 1].toLowerCase()}` : `Necesitas para eventos en ${year}`}
        </span>
        <span className="text-lg font-extrabold tabular-nums text-amber-300">{usd(total)}</span>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-400">
          {view === "mes"
            ? "No hay eventos este mes. Añade uno con su fecha y el dinero que necesitas (Navidad, cumpleaños, estrenos…)."
            : "Aún no tienes eventos. Añade los de cada año: se repiten solos."}
        </p>
      ) : view === "mes" ? (
        <ul>
          {shown.map((ev) => (
            <EventRow key={ev.id} ev={ev} year={year} onEdit={onEdit} />
          ))}
        </ul>
      ) : (
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-2 2xl:grid-cols-3">
          {MONTHS.map((label, i) => {
            const list = ofYear.filter((e) => e.event_month === i + 1);
            if (list.length === 0) return null;
            const sub = list.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between px-2">
                  <h3 className="text-xs font-bold tracking-wide text-slate-400 uppercase">{label}</h3>
                  <span className="text-sm font-semibold tabular-nums text-slate-400">{usd(sub)}</span>
                </div>
                <ul>
                  {list.map((ev) => (
                    <EventRow key={ev.id} ev={ev} year={year} onEdit={onEdit} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
