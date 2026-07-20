export type ProjectStatus = "Ongoing";

export type Project = {
  slug: string;
  name: string;
  role: string;
  status: ProjectStatus;
  tags: string[];
  summary: string;
  description: string;
};

export const projects: Project[] = [
  {
    slug: "deros",
    name: "DEROS",
    role: "Founder",
    status: "Ongoing",
    tags: ["Founder-Led", "Venture Building"],
    summary: "A venture built from the ground up — vision, execution, and everything between.",
    description:
      "DEROS is where I put the builder mindset to work: taking an idea from a blank page to something real, and owning every layer of that process along the way. Founding it meant learning to move between the conceptual and the operational without losing momentum in either direction.",
  },
  {
    slug: "sidequests-club",
    name: "The Sidequests Club at UCLA",
    role: "Founder",
    status: "Ongoing",
    tags: ["Community", "UCLA"],
    summary: "A community built for students who want to explore outside the syllabus.",
    description:
      "The Sidequests Club started from a simple belief — that some of the most valuable parts of college happen off the planned path. Founding SQC meant building the structure, culture, and momentum for a community from nothing, and giving it a reason to keep growing.",
  },
  {
    slug: "iota-psi-omega",
    name: "Iota Psi Omega",
    role: "Founder & President",
    status: "Ongoing",
    tags: ["Leadership", "Organization"],
    summary: "An organization founded and led from the first meeting onward.",
    description:
      "Founding and presiding over Iota Psi Omega meant building an organization's foundation — its structure, its standards, and the people who carry it forward — and then staying accountable for it as president, not just at the start.",
  },
];

export const capabilities = [
  {
    label: "Builder",
    description:
      "Comfortable turning an idea into something that exists — scoping it, shipping it, and iterating once it's real.",
  },
  {
    label: "Connector",
    description:
      "Founding communities and organizations has meant constantly bringing people together around a shared reason to show up.",
  },
  {
    label: "Operator",
    description:
      "Vision only matters if it runs day to day — structure, follow-through, and accountability are where it actually lives.",
  },
  {
    label: "Creative Strategist",
    description:
      "Every venture and organization here started as a question about positioning and direction before it became execution.",
  },
] as const;

export const education = {
  school: "UCLA",
  major: "Business Economics",
  minor: "Accounting",
  classYear: "2026",
} as const;
