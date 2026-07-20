import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SectionLabel } from "@/components/public/section-label";

export function HeroSection() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div className="fade-rise flex flex-col gap-6">
        <SectionLabel>{siteConfig.location}</SectionLabel>
        <h1 className="max-w-3xl font-[family-name:var(--font-fraunces)] text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          Creating rooms where ambitious people actually want to be.
        </h1>
        <SectionLabel>Class of 2026</SectionLabel>
        <p className="max-w-xl text-lg text-[#6B6558] sm:text-xl">
          Founder of DEROS, The Sidequests Club at UCLA, and Iota Psi Omega.
        </p>
      </div>

      <div className="fade-rise fade-rise-2 flex flex-wrap items-center gap-4">
        <Link
          href="/projects"
          className="rounded-full bg-[#17140F] px-6 py-3 text-sm font-medium text-[#F7F4EC] transition-colors hover:bg-[#322C22]"
        >
          View projects
        </Link>
        <Link
          href="/contact"
          className="group flex items-center gap-2 text-sm font-medium text-[#17140F]"
        >
          Get in touch
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            &rarr;
          </span>
        </Link>
      </div>
    </section>
  );
}
