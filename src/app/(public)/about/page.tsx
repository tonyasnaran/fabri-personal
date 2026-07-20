import type { Metadata } from "next";
import { PageIntro } from "@/components/public/page-intro";
import { SectionLabel } from "@/components/public/section-label";
import { CTASection } from "@/components/public/cta-section";
import { capabilities, education } from "@/config/public-content";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Anthony Asnaran — UCLA Business Economics & Accounting, class of 2026. Founder of DEROS, The Sidequests Club at UCLA, and Iota Psi Omega.",
};

export default function AboutPage() {
  return (
    <>
      <PageIntro
        label="About"
        title="If it doesn't exist yet, I'll probably just build it."
        description="Early on, I realized I'd rather start the thing than wait to be handed a seat at someone else's table."
      />

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E4DDCB] bg-[#E4DDCB] sm:grid-cols-2">
          {capabilities.map((capability, index) => (
            <div
              key={capability.label}
              className={`fade-rise fade-rise-${(index % 4) + 1} flex flex-col gap-3 bg-[#F7F4EC] p-8`}
            >
              <h2 className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight">
                {capability.label}
              </h2>
              <p className="text-sm text-[#6B6558]">{capability.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#E4DDCB] bg-[#F1ECE1]">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 py-24 sm:grid-cols-3">
          <div className="fade-rise flex flex-col gap-3">
            <SectionLabel>Education</SectionLabel>
            <p className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight">
              {education.school}
            </p>
            <p className="text-sm text-[#6B6558]">
              {education.major}, {education.minor} minor
              <br />
              Class of {education.classYear}
            </p>
          </div>

          <div className="fade-rise fade-rise-2 flex flex-col gap-3">
            <SectionLabel>Current Focus</SectionLabel>
            <p className="text-sm text-[#6B6558]">
              Right now, that&apos;s almost entirely DEROS — growing it, building real relationships
              across the events industry, and creating experiences people actually want to come back
              to. That takes shape as a running series: THE TABLE, THE COURT, THE RUN, THE AFTERS —
              recurring, wellness-forward experiences built on one idea: put the right people in the
              right room and let momentum do the rest.
            </p>
            <p className="text-sm text-[#6B6558]">
              The longer-term vision is a curated network — people, opportunities, and partnerships
              that compound over time, where what members know and share makes everyone in the room
              more effective, not just more connected.
            </p>
          </div>

          <div className="fade-rise fade-rise-3 flex flex-col gap-3">
            <SectionLabel>Location</SectionLabel>
            <p className="text-sm text-[#6B6558]">{siteConfig.location}</p>
          </div>
        </div>
      </section>

      <CTASection
        title="Let's talk."
        description="If any of this overlaps with what you're working on, I'd like to hear about it."
      />
    </>
  );
}
