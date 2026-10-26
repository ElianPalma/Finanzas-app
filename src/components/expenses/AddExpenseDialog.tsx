"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { TYPE_META, isRecurringType } from "@/lib/finance";
import { normalizeText } from "@/lib/icons";
import type { Category, Expense, ExpenseType } from "@/types/finance";

const PRIORITIES: ExpenseType[] = ["prioridad_alta", "prioridad_media", "prioridad_baja"];
const FIXED_TYPES: ExpenseType[] = ["indispensable", "servicio"];

export interface ExpenseFormValues {
  categoryId: string;
  type: ExpenseType;
  name: string;
  amount: number;
  /** Solo al editar un gasto fijo: aplicar el cambio también a los meses siguientes */
  applyForward: boolean;
}

interface Props {
  open: boolean;
  categories: Category[];
  /** Si viene un gasto, el diálogo funciona en modo edición */
  expense?: Expense | null;
  onClose: () => void;
  onSubmit: (v: ExpenseFormValues) => Promise<void>;
  onNewCategory: (defaultType: ExpenseType) => void;
  onEditCategory: (c: Category) => void;
}

export function AddExpenseDialog({
  open,
  categories,
  expense,
  onClose,
  onSubmit,
  onNewCategory,
  onEditCategory,
}: Props) {
  const [fixed, setFixed] = useState(true);
  const [priority, setPriority] = useState<ExpenseType>("prioridad_media");
  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [applyForward, setApplyForward] = useState(false);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const editing = !!expense;

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setQuery("");
    setApplyForward(true);
    if (expense) {
      setFixed(expense.template_id !== null);
      setPriority(isRecurringType(expense.category.type) ? "prioridad_media" : expense.category.type);
      setCategoryId(expense.category.id);
      setName(expense.name);
      setAmount(String(expense.amount));
    } else {
      setFixed(true);
      setPriority("prioridad_media");
      setCategoryId("");
      setName("");
      setAmount("");
    }
  }, [open, expense]);

  const term = normalizeText(query);
  const options = categories.filter(
    (c) =>
      (fixed ? isRecurringType(c.type) : c.type === priority) &&
      (!term || normalizeText(c.name).includes(term))
  );
  const selected = categories.find((c) => c.id === categoryId);
  const selectedValid = selected && (fixed ? isRecurringType(selected.type) : selected.type === priority);
  const groups: ExpenseType[] = fixed ? FIXED_TYPES : [priority];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !selectedValid) return setErr("Elige una categoría");
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({
        categoryId: selected.id,
        type: selected.type,
        name: name.trim() || selected.name,
        amount: Number(amount),
        applyForward,
      });
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  const seg = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
      active ? "bg-slate-600 text-white shadow-sm" : "text-slate-400"
    }`;

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar gasto" : "Nuevo gasto"}>
      <form onSubmit={submit} className="space-y-4">
        {!editing ? (
          <div className="flex rounded-xl bg-slate-800 p-1" role="radiogroup" aria-label="Tipo de gasto">
            <button type="button" role="radio" aria-checked={fixed} className={seg(fixed)} onClick={() => { setFixed(true); setCategoryId(""); }}>
              <Icon name="repeat" className="mr-1.5 inline size-4" />
              Fijo (cada mes)
            </button>
            <button type="button" role="radio" aria-checked={!fixed} className={seg(!fixed)} onClick={() => { setFixed(false); setCategoryId(""); }}>
              <Icon name="sparkles" className="mr-1.5 inline size-4" />
              Eventual
            </button>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300">
            <Icon name={fixed ? "repeat" : "sparkles"} className="size-4" />
            {fixed ? "Gasto fijo · se repite cada mes" : "Gasto eventual · solo este mes"}
          </p>
        )}

        {!fixed && (
          <div className="flex gap-2" role="radiogroup" aria-label="Prioridad">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={priority === p}
                onClick={() => { setPriority(p); setCategoryId(""); }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold ${
                  priority === p ? TYPE_META[p].badge + " ring-1 ring-current" : "bg-slate-800 text-slate-400"
                }`}
              >
                <Icon name={TYPE_META[p].icon} className="size-4" />
                {TYPE_META[p].label.replace("Prioridad ", "")}
              </button>
            ))}
          </div>
        )}

        {/* Categorías */}
        <div>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              placeholder="Buscar categoría…"
              aria-label="Buscar categoría"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pr-3 pl-9 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="max-h-64 space-y-3 overflow-y-auto pr-1" role="radiogroup" aria-label="Categoría">
            {groups.map((g) => {
              const list = options.filter((c) => c.type === g);
              return (
                <div key={g}>
                  {fixed && (
                    <p className="mb-1.5 text-xs font-bold tracking-wide text-slate-400 uppercase">{TYPE_META[g].label}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {list.map((c) => (
                      <div key={c.id} className="relative">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={categoryId === c.id}
                          onClick={() => setCategoryId(c.id)}
                          className={`flex h-full w-full flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold ${
                            categoryId === c.id
                              ? "border-emerald-500 bg-emerald-600 text-white"
                              : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          }`}
                        >
                          <Icon name={c.icon} className="size-5" />
                          <span className="text-center leading-tight">{c.name}</span>
                        </button>
                        {c.user_id && (
                          <button
                            type="button"
                            onClick={() => onEditCategory(c)}
                            aria-label={`Editar categoría ${c.name}`}
                            title="Editar categoría"
                            className="absolute top-1 right-1 rounded-md bg-slate-950/70 p-1 text-slate-300 hover:text-white"
                          >
                            <Pencil className="size-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {g === groups[groups.length - 1] && (
                      <button
                        type="button"
                        onClick={() => onNewCategory(g)}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-600 p-2.5 text-xs font-semibold text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
                      >
                        <Plus className="size-5" aria-hidden="true" />
                        Nueva categoría
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <label className="label">
          Nombre (opcional)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={selected?.name ?? "Ej: Cine con amigos"}
            className="field"
          />
        </label>
        <label className="label">
          {fixed ? "Monto base mensual (USD)" : "Monto (USD)"}
          <input
            type="number"
            required
            min="0"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field tabular-nums"
          />
        </label>

        {editing && expense?.template_id && (
          <label className="flex items-start gap-2.5 rounded-lg bg-slate-800 p-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={applyForward}
              onChange={(e) => setApplyForward(e.target.checked)}
              className="mt-0.5 size-4 accent-emerald-500"
            />
            <span>
              <span className="font-semibold">Aplicar también a los meses siguientes</span>
              <span className="block text-xs text-slate-400">
                Así cada mes sigue siendo copia del anterior. Si lo desmarcas, el cambio solo afecta a este mes.
              </span>
            </span>
          </label>
        )}

        {err && <p role="alert" className="text-sm font-semibold text-rose-400">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
          {busy ? "Guardando…" : editing ? "Guardar cambios" : "Guardar gasto"}
        </button>
      </form>
    </Modal>
  );
}
