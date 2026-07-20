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
    tags: ["Social Lifestyle Brand", "Community"],
    summary: "A social lifestyle brand for the ones who create momentum together.",
    description:
      "DEROS is a social lifestyle brand, not a startup pitch — built for people who move socially, creatively, and culturally. It isn't another event; it's a room built so the right people end up in it at the right time. The idea is simple: momentum matters more than credentials, and the people around you quietly become your future. DEROS exists so ambition doesn't have to cost you your friendships, your creativity, or your actual life — and so the ones who used to feel like they were on the outside find a room built for them.",
  },
  {
    slug: "sidequests-club",
    name: "The Sidequests Club at UCLA",
    role: "Founder",
    status: "Ongoing",
    tags: ["Community", "UCLA"],
    summary:
      "Built for Bruins who wanted curiosity, real experiences, and real people — not just a syllabus.",
    description:
      "The Sidequests Club started from a simple belief: the best parts of college rarely show up on the syllabus. Founding it meant building a community from nothing — a reason for curious people to keep showing up, meet each other, and experience college as more than a classroom.",
  },
  {
    slug: "iota-psi-omega",
    name: "Iota Psi Omega",
    role: "Founder & President",
    status: "Ongoing",
    tags: ["Startup Society", "UCLA"],
    summary: "A UCLA startup society for builders who wanted a community as strong as their ideas.",
    description:
      "Iota Psi Omega is a startup society and incubator at UCLA, built for technical and non-technical students who want to build startups together, not just attend meetings. Founding and presiding over it meant creating a community where ambitious builders and founders could collaborate on real ideas — one where the social side mattered as much as the technical one.",
  },
];

export const capabilities = [
  {
    label: "Builder",
    description:
      'I like taking an idea from "wouldn\'t it be cool if" to something real — then fixing it as I go.',
  },
  {
    label: "Sidequester",
    description:
      "I like the version of a plan, a place, or a night that isn't on the itinerary. Some of my best ideas — and best friends — came from a detour I didn't plan for.",
  },
  {
    label: "Creative Director",
    description:
      "I notice rooms, aesthetics, and the small details most people scroll past. Mood boards and the way a space feels have never been decoration to me — they're the point.",
  },
  {
    label: "Optimizer",
    description:
      "I like systems more than most people find normal. If something takes ten steps and could take three, I'll probably rebuild it — not because I have to, but because it bugs me otherwise.",
  },
] as const;

export const education = {
  school: "UCLA",
  major: "Business Economics",
  minor: "Accounting",
  classYear: "2026",
} as const;
