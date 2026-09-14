import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn, demoLoginEnabled } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/session";
import styles from "./login.module.css";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/goals");

  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const demoUsers = demoLoginEnabled
    ? await prisma.user.findMany({
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: { email: true, name: true, role: true },
      })
    : [];

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/goals" });
  }

  async function signInAsDemo(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    await signIn("dev-account", { email, redirectTo: "/goals" });
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.card}>
          <Image src="/logo.png" alt="Purely Works" width={172} height={48} className={styles.logo} priority />
          <div className={styles.title}>Quarterly Goals</div>
          <p className={styles.tagline}>Set the quarter, track the growth. One place for every goal at the company.</p>

          {googleConfigured && (
            <form action={signInWithGoogle}>
              <button type="submit" className={styles.googleButton}>
                Sign in with Google
              </button>
            </form>
          )}

          <p className={styles.note}>Access level comes from your account. There is no role selector in the product.</p>

          {demoLoginEnabled && demoUsers.length > 0 && (
            <div className={styles.demoSection}>
              <div className={styles.demoHeading}>Demo accounts</div>
              <div className={styles.demoList}>
                {demoUsers.map((u) => (
                  <form key={u.email} action={signInAsDemo}>
                    <input type="hidden" name="email" value={u.email} />
                    <button type="submit" className={styles.demoButton} title={u.email}>
                      {u.name} · {ROLE_LABELS[u.role]}
                    </button>
                  </form>
                ))}
              </div>
              <p className={styles.demoFootnote}>
                Sample data — for testing only, sign-in as any account with no password.
              </p>
            </div>
          )}
        </div>
        <div className={styles.footer}>Your role and visibility are set by your account.</div>
      </div>
    </div>
  );
}
