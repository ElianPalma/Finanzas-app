"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconPicker } from "@/components/ui/IconPicker";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Icon } from "@/components/ui/Icon";
import { ALL_TYPES, TYPE_META, isRecurringType } from "@/lib/finance";
import type { Category, ExpenseType } from "@/types/finance";

interface Props {
  open: boolean;
  /** null = crear una categoría nueva */
  category: Category | null;
  defaultType: ExpenseType;
  onClose: () => void;
  onSubmit: (v: { name: string; icon: string; type: ExpenseType }) => Promise<void>;
  onDelete?: (c: Category) => Promise<void>;
}

export function CategoryDialog({ open, category, defaultType, onClose, onSubmit, onDelete }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("tag");
  const [type, setType] = useState<ExpenseType>(defaultType);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setType(category.type);
    } else {
      setName("");
      setIcon("tag");
      setType(defaultType);
    }
  }, [open, category, defaultType]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({ name: name.trim(), icon, type });
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!category || !onDelete) return;
    setBusy(true);
    setErr(null);
    try {
      await onDelete(category);
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={category ? "Editar categoría" : "Nueva categoría"}>
      <form onSubmit={submit} className="space-y-4">
        <label className="label">
          Nombre
          <input
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Peluquería, Diezmo, Guardería…"
            className="field"
          />
        </label>

        <fieldset>
          <legend className="label mb-1">Tipo</legend>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de categoría">
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                disabled={!!category}
                onClick={() => setType(t)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold disabled:cursor-not-allowed ${
                  type === t
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : "border-slate-700 bg-slate-800 text-slate-300 enabled:hover:bg-slate-700"
                } ${category && type !== t ? "opacity-40" : ""}`}
              >
                <span className={`grid size-7 place-items-center rounded-md ${TYPE_META[t].badge}`}>
                  <Icon name={TYPE_META[t].icon} className="size-4" />
                </span>
                <span className="flex flex-col leading-tight">
                  {TYPE_META[t].label}
                  <span className="text-[11px] font-normal text-slate-400">
                    {isRecurringType(t) ? "Se repite cada mes" : "Solo ese mes"}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {category && (
            <p className="mt-1.5 text-xs text-slate-400">
              El tipo no se puede cambiar una vez creada la categoría (para no alterar tus gastos fijos).
            </p>
          )}
        </fieldset>

        <IconPicker value={icon} onChange={setIcon} />

        {err && <p role="alert" className="text-sm font-semibold text-rose-400">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
          {busy ? "Guardando…" : category ? "Guardar cambios" : "Crear categoría"}
        </button>
        {category && onDelete && (
          <DeleteButton
            label="Eliminar categoría"
            confirmText="¿Eliminar esta categoría? Solo se puede si no tiene gastos asociados."
            disabled={busy}
            onConfirm={remove}
          />
        )}
      </form>
    </Modal>
  );
}
