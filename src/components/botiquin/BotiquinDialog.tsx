"use client";

import { useEffect, useState } from "react";
import { BriefcaseMedical } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DeleteButton } from "@/components/ui/DeleteButton";
import type { Goal } from "@/types/finance";

interface Props {
  open: boolean;
  goal?: Goal | null;
  onClose: () => void;
  onSubmit: (v: { name: string; target: number }) => Promise<void>;
  onDelete?: (goal: Goal) => Promise<void>;
}

export function BotiquinDialog({ open, goal, onClose, onSubmit, onDelete }: Props) {
  const [name, setName] = useState("Botiquín");
  const [target, setTarget] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setName(goal ? goal.name : "Botiquín");
    setTarget(goal ? String(goal.target_amount) : "");
  }, [open, goal]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({ name: name.trim() || "Botiquín", target: Number(target) });
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
    <Modal open={open} onClose={onClose} title={goal ? "Editar botiquín" : "Crear botiquín"}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 p-3 text-sm text-slate-300">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-rose-600">
            <BriefcaseMedical className="size-7" aria-hidden="true" />
          </span>
          Dinero que dejas reservado para el fondo de salud (medicinas, consultas, emergencias).
        </div>
        <label className="label">
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="field" />
        </label>
        <label className="label">
          Monto que quieres tener en el fondo (USD)
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
        {err && <p role="alert" className="text-sm font-semibold text-rose-400">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-rose-600 py-2.5 font-bold text-white hover:bg-rose-500 disabled:opacity-50">
          {busy ? "Guardando…" : goal ? "Guardar cambios" : "Crear botiquín"}
        </button>
        {goal && onDelete && (
          <DeleteButton
            label="Eliminar botiquín"
            confirmText="¿Eliminar el botiquín? Se borrarán sus aportes y ese dinero vuelve a tu saldo disponible."
            disabled={busy}
            onConfirm={remove}
          />
        )}
      </form>
    </Modal>
  );
}
