import { signIn, authConfig } from "@/lib/auth/config";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const providerIds = authConfig.providers.map((provider) =>
    typeof provider === "function" ? provider({}).id : provider.id,
  ) as string[];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Access your private financial dashboard.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {providerIds.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            No sign-in providers are configured yet. Set AUTH_GOOGLE_ID/SECRET or
            AUTH_GITHUB_ID/SECRET in your environment to enable sign-in.
          </p>
        ) : (
          providerIds.map((id) => (
            <form
              key={id}
              action={async () => {
                "use server";
                await signIn(id, { redirectTo: callbackUrl ?? "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                {PROVIDER_LABELS[id] ?? `Continue with ${id}`}
              </button>
            </form>
          ))
        )}
      </div>
    </div>
  );
}
