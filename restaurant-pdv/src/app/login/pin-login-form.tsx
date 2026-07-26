"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loginWithPin, type PinLoginState } from "@/app/actions/auth";
import type { Role } from "@/generated/prisma/client";

type StaffUser = { id: string; name: string; role: Role };

const PIN_LENGTH = 4;

export function PinLoginForm({ users }: { users: StaffUser[] }) {
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [pin, setPin] = useState("");
  const [state, formAction, pending] = useActionState<PinLoginState, FormData>(
    loginWithPin,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o PIN quando um novo erro chega, sem usar useEffect — ajuste de
  // estado durante a renderização, comparando com o estado anterior visto.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state?.error) setPin("");
  }

  if (!selected) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {users.length === 0 && (
          <p className="col-span-2 text-center text-sm text-neutral-500">
            Nenhum garçom/caixa cadastrado ainda.
          </p>
        )}
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setSelected(u)}
            className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-5 text-left transition hover:border-neutral-600 active:scale-95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium">
              {u.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-sm font-medium">{u.name}</span>
            <span className="text-xs text-neutral-500">
              {u.role === "GARCOM" ? "Garçom" : "Caixa"}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={(fd) => {
        fd.set("userId", selected.id);
        fd.set("pin", pin);
        formAction(fd);
      }}
      className="flex flex-col items-center"
    >
      <button
        type="button"
        onClick={() => {
          setSelected(null);
          setPin("");
        }}
        className="mb-4 text-xs text-neutral-500 underline underline-offset-2"
      >
        ← trocar usuário
      </button>

      <p className="mb-4 text-sm text-neutral-300">
        Olá, <span className="font-medium text-white">{selected.name}</span>
      </p>

      <div className="mb-4 flex gap-3">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border border-neutral-600 ${
              i < pin.length ? "bg-white" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {state?.error && (
        <p className="mb-3 text-sm text-red-400">{state.error}</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
          (digit, i) =>
            digit === "" ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                type="button"
                disabled={pending}
                onClick={() => {
                  if (digit === "⌫") {
                    setPin((p) => p.slice(0, -1));
                    return;
                  }
                  setPin((p) => {
                    const next = (p + digit).slice(0, PIN_LENGTH);
                    return next;
                  });
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-lg font-medium text-neutral-50 transition hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
              >
                {digit}
              </button>
            )
        )}
      </div>

      <PinAutoSubmit pin={pin} pending={pending} formRef={formRef} />
    </form>
  );
}

function PinAutoSubmit({
  pin,
  pending,
  formRef,
}: {
  pin: string;
  pending: boolean;
  formRef: React.RefObject<HTMLFormElement | null>;
}) {
  useEffect(() => {
    if (pin.length !== PIN_LENGTH || pending) return;
    formRef.current?.requestSubmit();
  }, [pin, pending, formRef]);
  return null;
}
