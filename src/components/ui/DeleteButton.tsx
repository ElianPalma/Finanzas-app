"use client";

import { Trash2 } from "lucide-react";

/** Botón rojo de eliminar con confirmación nativa. */
export function DeleteButton({
  label = "Eliminar",
  confirmText,
  disabled,
  onConfirm,
}: {
  label?: string;
  confirmText: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (window.confirm(confirmText)) onConfirm();
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/40 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
    >
      <Trash2 className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
