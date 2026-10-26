"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPicker } from "@/components/ui/IconPicker";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { ENVELOPE_COLORS } from "@/lib/finance";
import type { Goal, GoalColor } from "@/types/finance";

const COLORS = Object.keys(ENVELOPE_COLORS) as GoalColor[];

interface Props {
  open: boolean;
  /** Si viene un sobre, el diálogo funciona en modo edición */
  goal?: Goal | null;
  onClose: () => void;
  onSubmit: (v: { name: string; icon: string; color: GoalColor; target: number }) => Promise<void>;
  onDelete?: (goal: Goal) => Promise<void>;
}

export function AddGoalDialog({ open, goal, onClose, onSubmit, onDelete }: Props) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState("piggy-bank");
  const [color, setColor] = useState<GoalColor>("violet");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (goal) {
      setName(goal.name);
      setTarget(String(goal.target_amount));
      setIcon(goal.icon);
      setColor(goal.color);
    } else {
      setName("");
      setTarget("");
      setIcon("piggy-bank");
      setColor("violet");
    }
  }, [open, goal]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({ name: name.trim(), icon, color, target: Number(target) });
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!goal || !onDelete) return;
    setBusy(true);
    try {
      await onDelete(goal);
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={goal ? "Editar sobre de ahorro" : "Nuevo sobre de ahorro"}>
      <form onSubmit={submit} className="space-y-4">
        <label className="label">
          Nombre
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Registro de mercado Palma"
            className="field"
          />
        </label>
        <label className="label">
          Meta (USD)
          <input
            type="number"
            required
            min="1"
            step="0.01"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="field tabular-nums"
          />
        </label>
        <IconPicker value={icon} onChange={setIcon} />
        <div className="flex gap-2" role="radiogroup" aria-label="Color del sobre">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={`size-9 rounded-full ${ENVELOPE_COLORS[c].seal} ${
                color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : ""
              }`}
            />
          ))}
        </div>
        {err && <p role="alert" className="text-sm font-semibold text-rose-400">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-violet-600 py-2.5 font-bold text-white hover:bg-violet-500 disabled:opacity-50">
          {busy ? "Guardando…" : goal ? "Guardar cambios" : "Crear sobre"}
        </button>
        {goal && onDelete && (
          <DeleteButton
            label="Eliminar sobre"
            confirmText="¿Eliminar este sobre? Se borrarán también sus aportes y ese dinero vuelve a tu saldo disponible."
            disabled={busy}
            onConfirm={remove}
          />
        )}
      </form>
    </Modal>
  );
}
