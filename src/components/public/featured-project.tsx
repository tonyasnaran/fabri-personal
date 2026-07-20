import Link from "next/link";
import { projects } from "@/config/public-content";
import { SectionLabel } from "@/components/public/section-label";

const deros = projects.find((project) => project.slug === "deros")!;

const columns = [
  {
    heading: "The room",
    body: "DEROS starts with the room, not the résumé. Put the right people in the right space and momentum takes care of itself.",
  },
  {
    heading: "The movement",
    body: "It moves socially, creatively, culturally — through experiences people actually remember, not another calendar invite.",
  },
  {
    heading: "What's next",
    body: "Still building, on purpose. DEROS stays a living thing rather than a finished pitch.",
  },
];

export function FeaturedProject() {
  return (
    <section className="border-t border-[#E4DDCB] bg-[#F1ECE1]">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="fade-rise flex flex-col gap-4">
          <SectionLabel>Featured Project</SectionLabel>
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl tracking-tight sm:text-5xl">
            {deros.name}
          </h2>
          <p className="max-w-xl text-lg text-[#6B6558]">{deros.summary}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {columns.map((column, index) => (
            <div
              key={column.heading}
              className={`fade-rise fade-rise-${index + 1} flex flex-col gap-2`}
            >
              <h3 className="text-sm font-semibold text-[#17140F]">{column.heading}</h3>
              <p className="text-sm text-[#6B6558]">{column.body}</p>
            </div>
          ))}
        </div>

        <div className="fade-rise mt-12">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[#17140F]"
          >
            See all projects
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
