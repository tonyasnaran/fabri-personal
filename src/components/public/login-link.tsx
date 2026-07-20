import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/require-user";

export async function LoginLink({ className }: { className?: string }) {
  const user = await getOptionalUser();
  const href = user ? "/dashboard" : "/sign-in";
  const label = user ? "Dashboard" : "Login";

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
