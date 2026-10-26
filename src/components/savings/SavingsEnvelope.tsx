"use client";

import { useState } from "react";
import { CircleCheck, Pencil, PiggyBank } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { ENVELOPE_COLORS, usd } from "@/lib/finance";
import type { Goal } from "@/types/finance";

const QUICK_AMOUNTS = [10, 25, 50, 100];

interface Props {
  goal: Goal;
  /** Saldo disponible del mes actual: tope para el aporte */
  available: number;
  /** Debe lanzar Error con mensaje legible si falla */
  onContribute: (goalId: string, amount: number) => Promise<void>;
  onEdit?: (goal: Goal) => void;
}

export function SavingsEnvelope({ goal, available, onContribute, onEdit }: Props) {
  const c = ENVELOPE_COLORS[goal.color];
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const done = goal.current_amount >= goal.target_amount;
  const amount = Number(value);
  const tooMuch = amount > available;
  const invalid = !Number.isFinite(amount) || amount <= 0 || tooMuch;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onContribute(goal.id, amount);
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el aporte");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`relative overflow-hidden rounded-2xl border border-white/10 shadow-sm ${c.paper}`}>
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(goal)}
          aria-label={`Editar sobre ${goal.name}`}
          title="Editar sobre"
          className="absolute top-2 right-2 z-10 rounded-lg bg-slate-950/50 p-1.5 text-slate-300 hover:bg-slate-950/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
        >
          <Pencil className="size-4" />
        </button>
      )}

      {/* Solapa del sobre */}
      <div
        className={`h-14 ${c.flap}`}
        style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        aria-hidden="true"
      />
      {/* Sello */}
      <div className="relative -mt-7 flex justify-center">
        <span className={`grid size-14 place-items-center rounded-full text-white ring-4 ring-slate-900 ${c.seal}`}>
          <Icon name={done ? "party-popper" : goal.icon} className="size-7" />
        </span>
      </div>

      <div className="px-4 pt-2 pb-4">
        <h3 className="text-center text-base font-extrabold text-slate-100">{goal.name}</h3>

        <div className="mt-3 flex items-end justify-between text-sm">
          <span className={`text-2xl font-extrabold tabular-nums ${c.text}`}>{usd(goal.current_amount)}</span>
          <span className="font-medium text-slate-400">de {usd(goal.target_amount)}</span>
        </div>
        {(goal.carry !== undefined || goal.added !== undefined) && (
          <p className="mt-1 flex flex-wrap justify-between gap-x-3 text-[11px] font-medium text-slate-400">
            <span>Arrastre del mes anterior: {usd(goal.carry ?? 0)}</span>
            <span>
              Este mes: {(goal.added ?? 0) < 0 ? "−" : "+"}
              {usd(Math.abs(goal.added ?? 0))}
            </span>
          </p>
        )}

        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso de ${goal.name}`}
          className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800 ring-1 ring-inset ring-white/5"
        >
          <div className={`h-full rounded-full transition-[width] duration-700 ${c.bar}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 flex items-center justify-end gap-1 text-xs font-bold text-slate-300">
          {done && <CircleCheck className="size-3.5 text-emerald-400" aria-hidden="true" />}
          {done ? "Meta alcanzada" : `${pct}%`}
        </p>

        {/* Aporte */}
        <form onSubmit={submit} className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={q > available}
                onClick={() => setValue(String(q))}
                className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200 ring-1 ring-white/10 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                +{q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor={`amt-${goal.id}`}>Monto a guardar en {goal.name}</label>
            <input
              id={`amt-${goal.id}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              className="min-w-0 flex-1 rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={invalid || busy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 ${c.seal}`}
            >
              <PiggyBank className="size-4" aria-hidden="true" />
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </div>
          {(error || tooMuch) && (
            <p role="alert" className="text-xs font-semibold text-rose-400">
              {error ?? `Solo tienes ${usd(Math.max(available, 0))} disponibles este mes`}
            </p>
          )}
        </form>
      </div>
    </article>
  );
}
