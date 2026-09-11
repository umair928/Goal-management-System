import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export { ROLE_LABELS, canSeeTeam, canSeeOrganization, canEditUsers } from "@/lib/roles";

/** Redirects to /login when there is no session. Use in server components/pages. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}
