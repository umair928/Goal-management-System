import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn, demoLoginEnabled } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/session";

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
    <div
      className="min-h-screen grid place-items-center px-6 py-10"
      style={{
        backgroundColor: "#EAEEF4",
        backgroundImage:
          "linear-gradient(#DCE3EC 1px, transparent 1px), linear-gradient(90deg, #DCE3EC 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="w-full max-w-[392px]">
        <div className="bg-card border border-border-strong rounded-lg px-8 pt-[34px] pb-[30px]">
          <Image src="/logo.png" alt="Purely Works" width={172} height={48} className="block h-auto w-[172px]" priority />
          <div className="font-heading text-[15px] tracking-[0.1em] uppercase font-bold text-chambray mt-5">
            Quarterly Goals
          </div>
          <p className="text-[13px] text-muted leading-relaxed mt-3.5 mb-7">
            Set the quarter, track the growth. One place for every goal at the company.
          </p>

          {googleConfigured && (
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="w-full py-3 bg-chambray hover:bg-chambray-hover text-white font-heading text-[12px] tracking-[0.1em] uppercase rounded-md cursor-pointer transition-colors"
              >
                Sign in with Google
              </button>
            </form>
          )}

          <p className="text-[11px] text-faint leading-relaxed mt-4 text-center">
            Access level comes from your account. There is no role selector in the product.
          </p>

          {demoLoginEnabled && demoUsers.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border-soft">
              <div className="font-heading text-[9px] tracking-[0.14em] uppercase text-faint mb-2.5">
                Demo accounts
              </div>
              <div className="flex flex-wrap gap-1.5">
                {demoUsers.map((u) => (
                  <form key={u.email} action={signInAsDemo}>
                    <input type="hidden" name="email" value={u.email} />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 border border-border-strong rounded-full bg-surface-alt text-[11px] text-chambray cursor-pointer"
                      title={u.email}
                    >
                      {u.name} · {ROLE_LABELS[u.role]}
                    </button>
                  </form>
                ))}
              </div>
              <p className="text-[11px] text-faint leading-relaxed mt-2">
                Sample data — for testing only, sign-in as any account with no password.
              </p>
            </div>
          )}
        </div>
        <div className="font-heading text-[10px] text-faint mt-4 tracking-[0.04em] text-center">
          Your role and visibility are set by your account.
        </div>
      </div>
    </div>
  );
}
