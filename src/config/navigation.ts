export type NavItem = {
  label: string;
  href: string;
};

export const publicNavigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const dashboardNavigation: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Accounts", href: "/dashboard/accounts" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Settings", href: "/dashboard/settings" },
];
