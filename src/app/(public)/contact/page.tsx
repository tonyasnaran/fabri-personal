import { siteConfig } from "@/config/site";

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Contact</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        The best way to reach me is by email at{" "}
        <a href={siteConfig.links.email} className="font-medium underline underline-offset-2">
          {siteConfig.links.email.replace("mailto:", "")}
        </a>
        .
      </p>
    </div>
  );
}
