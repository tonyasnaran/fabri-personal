import Link from "next/link";
import { projects } from "@/config/public-content";
import { SectionLabel } from "@/components/public/section-label";

export function SelectedProjects() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="fade-rise flex flex-col gap-3">
        <SectionLabel>Selected Projects</SectionLabel>
        <h2 className="font-[family-name:var(--font-fraunces)] text-4xl tracking-tight sm:text-5xl">
          Founded and run, not just advised.
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#E4DDCB] bg-[#E4DDCB] sm:grid-cols-3">
        {projects.map((project, index) => (
          <div
            key={project.slug}
            className={`fade-rise fade-rise-${index + 1} group flex flex-col gap-4 bg-[#F7F4EC] p-8 transition-colors hover:bg-[#F1ECE1]`}
          >
            <span className="text-xs font-semibold tracking-[0.2em] text-[#8A8371] uppercase">
              {project.role}
            </span>
            <h3 className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight">
              {project.name}
            </h3>
            <p className="text-sm text-[#6B6558]">{project.summary}</p>
          </div>
        ))}
      </div>

      <div className="fade-rise mt-10">
        <Link
          href="/projects"
          className="group inline-flex items-center gap-2 text-sm font-medium text-[#17140F]"
        >
          Explore all projects
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            &rarr;
          </span>
        </Link>
      </div>
    </section>
  );
}
