import { SectionLabel } from "@/components/public/section-label";

export function PageIntro({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="fade-rise mx-auto flex max-w-3xl flex-col gap-4 px-6 pt-20 pb-12 sm:pt-28">
      <SectionLabel>{label}</SectionLabel>
      <h1 className="font-[family-name:var(--font-fraunces)] text-4xl leading-[1.1] tracking-tight sm:text-5xl">
        {title}
      </h1>
      {description ? <p className="max-w-xl text-lg text-[#6B6558]">{description}</p> : null}
    </div>
  );
}
