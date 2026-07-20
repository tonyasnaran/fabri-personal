import { projects } from "@/config/public-content";
import { ProjectCard } from "@/components/public/project-card";

export function ProjectIndex() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col px-6">
      {projects.map((project, index) => (
        <ProjectCard key={project.slug} project={project} index={index} />
      ))}
    </div>
  );
}
