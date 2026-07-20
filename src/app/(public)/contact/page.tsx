import type { Metadata } from "next";
import { PageIntro } from "@/components/public/page-intro";
import { SectionLabel } from "@/components/public/section-label";
import { ExternalLink } from "@/components/public/external-link";
import { ContactForm } from "@/components/public/contact-form";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Anthony Asnaran.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        label="Contact"
        title="Let's find time to talk."
        description="The fastest way to reach me is to book a call directly."
      />

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="fade-rise flex flex-col items-start gap-4 rounded-2xl border border-[#E4DDCB] bg-[#F1ECE1] p-8">
          <SectionLabel>Book a call</SectionLabel>
          <p className="max-w-md text-[#6B6558]">
            Pick a time that works for you and it&apos;ll go straight on my calendar.
          </p>
          <ExternalLink
            href={siteConfig.cal.url}
            className="rounded-full bg-[#17140F] px-6 py-3 text-sm font-medium text-[#F7F4EC] transition-colors hover:bg-[#322C22]"
          >
            {siteConfig.cal.label}
          </ExternalLink>
        </div>

        <div className="fade-rise mt-16 flex flex-col gap-6">
          <SectionLabel>Or send a message</SectionLabel>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
