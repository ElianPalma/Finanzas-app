"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPicker } from "@/components/ui/IconPicker";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { MONTHS, maxDaysOfMonth } from "@/lib/finance";
import type { EventItem } from "@/types/finance";

interface Props {
  open: boolean;
  /** Año que se está viendo (se usa si el evento no se repite cada año) */
  year: number;
  /** Mes que se está viendo (valor inicial al crear) */
  month: number;
  event?: EventItem | null;
  onClose: () => void;
  onSubmit: (v: {
    name: string;
    icon: string;
    month: number;
    day: number;
    amount: number;
    yearly: boolean;
  }) => Promise<void>;
  onDelete?: (event: EventItem) => Promise<void>;
}

export function EventDialog({ open, year, month, event, onClose, onSubmit, onDelete }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("party-popper");
  const [evMonth, setEvMonth] = useState(month);
  const [day, setDay] = useState(1);
  const [amount, setAmount] = useState("");
  const [yearly, setYearly] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (event) {
      setName(event.name);
      setIcon(event.icon);
      setEvMonth(event.event_month);
      setDay(event.event_day);
      setAmount(String(event.amount));
      setYearly(event.year === null);
    } else {
      setName("");
      setIcon("party-popper");
      setEvMonth(month);
      setDay(1);
      setAmount("");
      setYearly(true);
    }
  }, [open, event, month]);

  const maxDay = maxDaysOfMonth(evMonth);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({
        name: name.trim(),
        icon,
        month: evMonth,
        day: Math.min(day, maxDay),
        amount: Number(amount || 0),
        yearly,
      });
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!event || !onDelete) return;
    setBusy(true);
    try {
      await onDelete(event);
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={event ? "Editar evento" : "Nuevo evento"}>
      <form onSubmit={submit} className="space-y-4">
        <label className="label">
          Nombre del evento
          <input
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navidad, estrenos, cumpleaños de mi hermana…"
            className="field"
          />
        </label>

        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <label className="label">
            Mes
            <select
              value={evMonth}
              onChange={(e) => {
                const m = Number(e.target.value);
                setEvMonth(m);
                setDay((d) => Math.min(d, maxDaysOfMonth(m)));
              }}
              className="field"
            >
              {MONTHS.map((label, i) => (
                <option key={label} value={i + 1}>{label}</option>
              ))}
            </select>
          </label>
          <label className="label">
            Día
            <input
              type="number"
              min={1}
              max={maxDay}
              value={day}
              onChange={(e) => setDay(Math.min(maxDay, Math.max(1, Number(e.target.value) || 1)))}
              className="field tabular-nums"
            />
          </label>
        </div>

        <label className="label">
          Dinero que necesitas para este evento (USD)
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="field tabular-nums"
          />
        </label>

        <label className="flex items-start gap-2.5 rounded-lg bg-slate-800 p-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={yearly}
            onChange={(e) => setYearly(e.target.checked)}
            className="mt-0.5 size-4 accent-emerald-500"
          />
          <span>
            <span className="font-semibold">Se repite cada año</span>
            <span className="block text-xs text-slate-400">
              {yearly
                ? "Aparecerá en todos los años con este mismo monto (puedes editarlo cuando quieras)."
                : `Solo aparecerá en ${year}.`}
            </span>
          </span>
        </label>

        <IconPicker value={icon} onChange={setIcon} />

        {err && <p role="alert" className="text-sm font-semibold text-rose-400">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-amber-500 py-2.5 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50">
          {busy ? "Guardando…" : event ? "Guardar cambios" : "Guardar evento"}
        </button>
        {event && onDelete && (
          <DeleteButton
            label="Eliminar evento"
            confirmText={
              event.year === null
                ? "¿Eliminar este evento? Desaparecerá de todos los años."
                : "¿Eliminar este evento?"
            }
            disabled={busy}
            onConfirm={remove}
          />
        )}
      </form>
    </Modal>
  );
}
