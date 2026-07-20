import type { Metadata } from "next";
import { HeroSection } from "@/components/public/hero-section";
import { FeaturedProject } from "@/components/public/featured-project";
import { SelectedProjects } from "@/components/public/selected-projects";
import { ShortAbout } from "@/components/public/short-about";
import { CTASection } from "@/components/public/cta-section";

export const metadata: Metadata = {
  title: "Anthony Asnaran",
  description:
    "Anthony Asnaran is a Los Angeles-based builder — Founder of DEROS, The Sidequests Club at UCLA, and Iota Psi Omega.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProject />
      <SelectedProjects />
      <ShortAbout />
      <CTASection
        title="Let's build something."
        description="Open to conversations about ventures, community, and what's next."
      />
    </>
  );
}
