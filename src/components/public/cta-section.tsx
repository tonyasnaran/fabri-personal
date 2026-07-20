import Link from "next/link";

export function CTASection({
  title,
  description,
  href = "/contact",
  linkLabel = "Get in touch",
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section className="border-t border-[#E4DDCB]">
      <div className="fade-rise mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-24 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl tracking-tight sm:text-5xl">
            {title}
          </h2>
          {description ? <p className="text-lg text-[#6B6558]">{description}</p> : null}
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-full bg-[#17140F] px-6 py-3 text-sm font-medium text-[#F7F4EC] transition-colors hover:bg-[#322C22]"
        >
          {linkLabel}
        </Link>
      </div>
    </section>
  );
}
