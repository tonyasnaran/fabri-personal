import Link from "next/link";
import { projects } from "@/config/public-content";
import { SectionLabel } from "@/components/public/section-label";

const deros = projects.find((project) => project.slug === "deros")!;

const columns = [
  {
    heading: "The build",
    body: "Every founder-led project starts the same way: an idea with no scaffolding yet. DEROS meant building that scaffolding myself — structure, direction, and the first real version.",
  },
  {
    heading: "The ownership",
    body: "There's no separation between strategy and execution when you're the one doing both. DEROS is where I learned to hold the whole picture at once.",
  },
  {
    heading: "What's next",
    body: "Still building. DEROS stays a live, ongoing effort rather than a finished case study.",
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
