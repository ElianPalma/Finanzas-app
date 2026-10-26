"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPicker } from "@/components/ui/IconPicker";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { MONTHS } from "@/lib/finance";
import type { Income } from "@/types/finance";

interface Props {
  open: boolean;
  year: number;
  month: number;
  /** Si viene un ingreso, el diálogo funciona en modo edición */
  income?: Income | null;
  onClose: () => void;
  onSubmit: (v: { date: string; amount: number; description: string; icon: string }) => Promise<void>;
  onDelete?: (income: Income) => Promise<void>;
}

export function AddIncomeDialog({ open, year, month, income, onClose, onSubmit, onDelete }: Props) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const [day, setDay] = useState(1);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("banknote");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (income) {
      setDay(Number(income.income_date.slice(8, 10)));
      setAmount(String(income.amount));
      setDescription(income.description);
      setIcon(income.icon);
    } else {
      setDay(1);
      setAmount("");
      setDescription("");
      setIcon("banknote");
    }
  }, [open, income]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      await onSubmit({ date, amount: Number(amount), description, icon });
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!income || !onDelete) return;
    setBusy(true);
    try {
      await onDelete(income);
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${income ? "Editar ingreso" : "Nuevo ingreso"} · ${MONTHS[month - 1]}`}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="label">
          Día del mes
          <input
            type="number"
            min={1}
            max={daysInMonth}
            value={day}
            onChange={(e) => setDay(Math.min(daysInMonth, Math.max(1, Number(e.target.value) || 1)))}
            className="field tabular-nums"
          />
        </label>
        <label className="label">
          Monto (USD)
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field tabular-nums"
          />
        </label>
        <label className="label">
          Descripción
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sueldo, venta, bono…"
            className="field"
          />
        </label>
        <IconPicker value={icon} onChange={setIcon} />
        {err && <p role="alert" className="text-sm font-semibold text-rose-400">{err}</p>}
        <button
          disabled={busy}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Guardando…" : income ? "Guardar cambios" : "Guardar ingreso"}
        </button>
        {income && onDelete && (
          <DeleteButton
            label="Eliminar ingreso"
            confirmText="¿Eliminar este ingreso? El saldo del mes se recalcula."
            disabled={busy}
            onConfirm={remove}
          />
        )}
      </form>
    </Modal>
  );
}
