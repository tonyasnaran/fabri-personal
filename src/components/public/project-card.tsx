import type { Project } from "@/config/public-content";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article
      className={`fade-rise group flex flex-col gap-4 border-t border-[#E4DDCB] py-10 transition-colors first:border-t-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-10`}
      style={{ animationDelay: `${Math.min(index, 4) * 0.1}s` }}
    >
      <div className="flex flex-col gap-3 sm:max-w-md">
        <div className="flex items-center gap-3">
          <h3 className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight transition-transform duration-300 group-hover:translate-x-1">
            {project.name}
          </h3>
          <span className="rounded-full border border-[#E4DDCB] px-2.5 py-0.5 text-xs text-[#6B6558]">
            {project.status}
          </span>
        </div>
        <p className="text-sm text-[#6B6558]">{project.description}</p>
      </div>

      <div className="flex flex-col gap-3 sm:items-end">
        <p className="text-sm font-medium text-[#17140F]">{project.role}</p>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#F1ECE1] px-2.5 py-1 text-xs text-[#6B6558]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
