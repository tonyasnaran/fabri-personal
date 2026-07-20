"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/**
 * Generic submit button that shows a pending state while its enclosing
 * form's server action is in flight. Needs its own Client Component
 * because `useFormStatus` only works when called from a component
 * rendered *inside* the `<form>`, not the form's parent.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
