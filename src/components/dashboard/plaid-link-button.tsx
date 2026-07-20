"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

type Status = "loading-token" | "ready" | "connecting" | "error";

/**
 * Client-only by necessity: Plaid Link is a browser SDK that has to run in
 * the user's browser. Every step that touches the access token or Plaid
 * secret happens server-side (create-link-token, exchange-public-token) —
 * this component only ever sees a short-lived link_token and a one-time
 * public_token, never anything long-lived or sensitive.
 */
export function PlaidLinkButton() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading-token");

  useEffect(() => {
    let cancelled = false;

    async function fetchLinkToken() {
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const body = await response.json();
        if (cancelled) return;

        if (!response.ok || body.error) {
          setStatus("error");
          return;
        }

        setLinkToken(body.data.linkToken);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void fetchLinkToken();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      setStatus("connecting");
      try {
        const response = await fetch("/api/plaid/exchange-public-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken }),
        });
        const body = await response.json();
        if (!response.ok || body.error) {
          setStatus("error");
          return;
        }
        router.refresh();
      } catch {
        setStatus("error");
      }
    },
    [router],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess,
  });

  if (status === "error") {
    return (
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        Couldn&apos;t start account connection. Please try again in a moment.
      </p>
    );
  }

  const isBusy = status === "loading-token" || status === "connecting" || !ready;

  return (
    <button
      type="button"
      onClick={() => open()}
      disabled={isBusy}
      aria-busy={isBusy}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
    >
      {status === "connecting" ? "Connecting…" : "Connect an account"}
    </button>
  );
}
