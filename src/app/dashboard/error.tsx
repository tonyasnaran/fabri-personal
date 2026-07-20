"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side errors are already logged via the structured logger where
    // they occur; this is a client-side safety net so nothing is silently lost.
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load your dashboard"
      description="Something went wrong loading this page. Please try again."
      onRetry={reset}
    />
  );
}
