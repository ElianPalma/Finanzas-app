"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(mode: "in" | "up") {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setMsg("Revisa tu correo para confirmar la cuenta y luego inicia sesión.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-4 text-slate-100">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run("in");
        }}
        className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white">
            <Wallet className="size-5" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-extrabold">Mis finanzas</h1>
        </div>
        <label className="label">
          Correo
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </label>
        <label className="label">
          Contraseña
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </label>
        {msg && (
          <p role="alert" className="text-sm font-semibold text-rose-400">
            {msg}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            <LogIn className="size-4" aria-hidden="true" /> Entrar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("up")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-700 py-2 font-bold text-white hover:bg-slate-600 disabled:opacity-50"
          >
            <UserPlus className="size-4" aria-hidden="true" /> Crear cuenta
          </button>
        </div>
      </form>
    </main>
  );
}
