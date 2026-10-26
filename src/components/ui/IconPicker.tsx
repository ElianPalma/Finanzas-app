"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Icon, iconExists } from "./Icon";
import { ALL_ICONS, ICON_GROUPS, normalizeText, type IconEntry } from "@/lib/icons";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [group, setGroup] = useState<string>("todos");
  const [q, setQ] = useState("");

  const list: IconEntry[] = useMemo(() => {
    const term = normalizeText(q);
    if (term) {
      return ALL_ICONS.filter(
        (i) => iconExists(i.name) && normalizeText(`${i.name} ${i.keywords}`).includes(term)
      );
    }
    const base = group === "todos" ? ALL_ICONS : ICON_GROUPS.find((g) => g.id === group)?.icons ?? [];
    return base.filter((i) => iconExists(i.name));
  }, [group, q]);

  const tab = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
      active ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
    }`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white" title={value}>
          <Icon name={value} className="size-5" />
        </span>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder="Buscar icono (carro, médico, regalo…)"
            aria-label="Buscar icono"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pr-3 pl-9 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {!q && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Grupos de iconos">
          <button type="button" role="tab" aria-selected={group === "todos"} className={tab(group === "todos")} onClick={() => setGroup("todos")}>
            Todos
          </button>
          {ICON_GROUPS.map((g) => (
            <button key={g.id} type="button" role="tab" aria-selected={group === g.id} className={tab(group === g.id)} onClick={() => setGroup(g.id)}>
              {g.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="grid max-h-48 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-2 sm:grid-cols-8"
        role="radiogroup"
        aria-label="Icono"
      >
        {list.length === 0 && <p className="col-span-full p-3 text-center text-sm text-slate-500">Sin resultados</p>}
        {list.map(({ name }) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            aria-label={name}
            title={name}
            onClick={() => onChange(name)}
            className={`grid size-10 place-items-center rounded-lg transition-colors ${
              value === name ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Icon name={name} className="size-5" />
          </button>
        ))}
      </div>
    </div>
  );
}
