import { signIn, authConfig } from "@/lib/auth/config";
import { SubmitButton } from "@/components/forms/submit-button";
import { EmailSignInForm } from "./email-sign-in-form";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

const EMAIL_PROVIDER_ID = "resend";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  const providerIds = authConfig.providers.map((provider) =>
    typeof provider === "function" ? provider({}).id : provider.id,
  ) as string[];

  const oauthProviderIds = providerIds.filter((id) => id !== EMAIL_PROVIDER_ID);
  const hasEmailProvider = providerIds.includes(EMAIL_PROVIDER_ID);
  const hasAnyProvider = providerIds.length > 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Access your private financial dashboard.
      </p>

      {!hasAnyProvider && (
        <p
          role="status"
          className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          No sign-in providers are configured yet. Set AUTH_GOOGLE_ID/SECRET, AUTH_GITHUB_ID/SECRET,
          or AUTH_RESEND_KEY/AUTH_EMAIL_FROM in your environment to enable sign-in.
        </p>
      )}

      {oauthProviderIds.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {oauthProviderIds.map((id) => (
            <form
              key={id}
              action={async () => {
                "use server";
                await signIn(id, { redirectTo: callbackUrl ?? "/dashboard" });
              }}
            >
              <SubmitButton
                pendingLabel="Redirecting…"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                {PROVIDER_LABELS[id] ?? `Continue with ${id}`}
              </SubmitButton>
            </form>
          ))}
        </div>
      )}

      {oauthProviderIds.length > 0 && hasEmailProvider && (
        <div className="my-6 flex items-center gap-3" role="separator" aria-label="or">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">or</span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      )}

      {hasEmailProvider && <EmailSignInForm />}
    </div>
  );
}
