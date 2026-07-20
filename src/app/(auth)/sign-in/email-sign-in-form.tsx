"use client";

import { useActionState } from "react";
import { sendMagicLinkAction, type SendMagicLinkState } from "./actions";

const initialState: SendMagicLinkState = { status: "idle" };

export function EmailSignInForm() {
  const [state, formAction, isPending] = useActionState(sendMagicLinkAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2" noValidate>
      <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        disabled={isPending}
        aria-invalid={state.status === "error"}
        aria-describedby={state.message ? "email-signin-message" : undefined}
        placeholder="you@example.com"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />

      {state.message && (
        <p
          id="email-signin-message"
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-red-600 dark:text-red-400"
              : "text-sm text-emerald-600 dark:text-emerald-400"
          }
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="mt-1 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}
