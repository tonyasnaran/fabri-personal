import Link from "next/link";
import { SectionLabel } from "@/components/public/section-label";

export function ShortAbout() {
  return (
    <section className="border-t border-[#E4DDCB] bg-[#F1ECE1]">
      <div className="fade-rise mx-auto flex max-w-3xl flex-col gap-6 px-6 py-24">
        <SectionLabel>About</SectionLabel>
        <p className="font-[family-name:var(--font-fraunces)] text-3xl leading-snug tracking-tight sm:text-4xl">
          UCLA Business Economics &amp; Accounting, class of 2026 — and a habit of founding the
          thing instead of waiting for it to exist.
        </p>
        <Link
          href="/about"
          className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-[#17140F]"
        >
          More about me
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            &rarr;
          </span>
        </Link>
      </div>
    </section>
  );
}
