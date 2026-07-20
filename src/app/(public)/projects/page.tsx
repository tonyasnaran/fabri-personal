import type { Metadata } from "next";
import { PageIntro } from "@/components/public/page-intro";
import { ProjectIndex } from "@/components/public/project-index";
import { CTASection } from "@/components/public/cta-section";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "DEROS, The Sidequests Club at UCLA, and Iota Psi Omega — founded and led by Anthony Asnaran.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageIntro
        label="Projects"
        title="Things I've founded and continue to run."
        description="Each of these started as a decision to build the thing myself rather than wait for it to exist."
      />
      <div className="pb-24">
        <ProjectIndex />
      </div>
      <CTASection
        title="Want to talk through one of these?"
        description="Happy to go deeper on any of it."
      />
    </>
  );
}
