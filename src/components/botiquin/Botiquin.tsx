"use client";

import { useState } from "react";
import { ArrowDownToLine, BriefcaseMedical, Pencil, Plus } from "lucide-react";
import { usd } from "@/lib/finance";
import type { Goal } from "@/types/finance";

const QUICK_AMOUNTS = [10, 25, 50, 100];

interface Props {
  /** null = todavía no existe el botiquín */
  goal: Goal | null;
  /** Saldo disponible del mes: tope para aportar */
  available: number;
  onCreate: () => void;
  onEdit: (goal: Goal) => void;
  onContribute: (goalId: string, amount: number) => Promise<void>;
  onWithdraw: (goalId: string, amount: number) => Promise<void>;
}

export function Botiquin({ goal, available, onCreate, onEdit, onContribute, onWithdraw }: Props) {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!goal) {
    return (
      <section aria-label="Botiquín" className="rounded-3xl border border-dashed border-rose-500/40 bg-rose-500/5 p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-rose-600">
            <BriefcaseMedical className="size-8" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold tracking-tight">Botiquín</h2>
            <p className="text-sm text-slate-400">
              Tu fondo de salud: separa aquí el dinero para medicinas, consultas y emergencias.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 py-2.5 font-bold text-white hover:bg-rose-500"
        >
          <Plus className="size-4" aria-hidden="true" />
          Crear mi botiquín
        </button>
      </section>
    );
  }

  const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
  const amount = Number(value);
  const limit = mode === "add" ? available : goal.current_amount;
  const tooMuch = amount > limit;
  const invalid = !Number.isFinite(amount) || amount <= 0 || tooMuch;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal || invalid || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "add") await onContribute(goal.id, amount);
      else await onWithdraw(goal.id, amount);
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  const seg = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
      active ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <section aria-label="Botiquín" className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5">
      <button
        type="button"
        onClick={() => onEdit(goal)}
        aria-label="Editar botiquín"
        title="Editar botiquín"
        className="absolute top-3 right-3 rounded-lg bg-slate-950/50 p-1.5 text-slate-300 hover:bg-slate-950/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
      >
        <Pencil className="size-4" />
      </button>

      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white text-rose-600 shadow-lg shadow-rose-950/40">
          <BriefcaseMedical className="size-10" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold tracking-tight">{goal.name}</h2>
          <p className="text-xs font-medium text-rose-200/70">Fondo de salud</p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between text-sm">
        <span className="text-3xl font-extrabold tabular-nums text-rose-200">{usd(goal.current_amount)}</span>
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
        aria-label="Progreso del botiquín"
        className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800 ring-1 ring-inset ring-white/5"
      >
        <div className="h-full rounded-full bg-rose-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-right text-xs font-bold text-slate-300">{pct >= 100 ? "Fondo completo" : `${pct}%`}</p>

      <form onSubmit={submit} className="mt-3 space-y-2">
        <div className="flex rounded-xl bg-slate-900/70 p-1" role="radiogroup" aria-label="Operación">
          <button type="button" role="radio" aria-checked={mode === "add"} className={seg(mode === "add")} onClick={() => { setMode("add"); setError(null); }}>
            Aportar
          </button>
          <button type="button" role="radio" aria-checked={mode === "remove"} className={seg(mode === "remove")} onClick={() => { setMode("remove"); setError(null); }}>
            Retirar
          </button>
        </div>

        {mode === "add" && (
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
        )}

        <div className="flex gap-2">
          <label className="sr-only" htmlFor="botiquin-monto">
            Monto a {mode === "add" ? "aportar al" : "retirar del"} botiquín
          </label>
          <input
            id="botiquin-monto"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            placeholder="0.00"
            className="min-w-0 flex-1 rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={invalid || busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === "add" ? <BriefcaseMedical className="size-4" aria-hidden="true" /> : <ArrowDownToLine className="size-4" aria-hidden="true" />}
            {busy ? "Guardando…" : mode === "add" ? "Guardar" : "Retirar"}
          </button>
        </div>
        {mode === "remove" && (
          <p className="text-xs text-slate-400">El dinero retirado vuelve a tu disponible de este mes.</p>
        )}
        {(error || tooMuch) && (
          <p role="alert" className="text-xs font-semibold text-rose-300">
            {error ??
              (mode === "add"
                ? `Solo tienes ${usd(Math.max(available, 0))} disponibles este mes`
                : `El botiquín solo tiene ${usd(goal.current_amount)}`)}
          </p>
        )}
      </form>
    </section>
  );
}
