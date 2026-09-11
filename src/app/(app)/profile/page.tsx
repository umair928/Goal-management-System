import { requireSession } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { initialsFor } from "@/lib/status";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { manager: { select: { name: true, email: true } } },
  });

  const assignedFields = [
    { label: "Designation", value: user.designation ?? "Not yet assigned" },
    { label: "Department", value: user.department ?? "Not yet assigned" },
    { label: "Reports to", value: user.manager?.name ?? user.manager?.email ?? "Not yet assigned" },
    { label: "Access level", value: user.accessLevel ?? "Standard" },
  ];

  return (
    <div className="max-w-[860px] mx-auto grid gap-5">
      <div className="flex items-center gap-4">
        <div className="w-[52px] h-[52px] bg-border-soft rounded-full grid place-items-center font-heading text-[15px] text-chambray">
          {initialsFor(user.name, user.email)}
        </div>
        <div>
          <h1 className="font-heading font-semibold text-[19px] m-0 tracking-tight">{user.name ?? user.email}</h1>
          <div className="font-heading text-[10px] tracking-[0.12em] uppercase text-muted mt-1">
            {ROLE_LABELS[user.role]}
          </div>
        </div>
      </div>

      <section className="bg-card border border-border rounded-[10px]">
        <div className="px-5 py-3.5 border-b border-border-soft flex items-center justify-between gap-3 flex-wrap">
          <div className="font-heading text-[11px] tracking-[0.1em] uppercase">Assigned by your administrator</div>
          <div className="font-heading text-[10px] tracking-[0.06em] px-2.5 py-1.5 rounded-full bg-border-soft text-chambray">
            Read-only
          </div>
        </div>
        <div className="p-5 grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {assignedFields.map((f) => (
            <div key={f.label}>
              <div className="font-heading text-[9px] tracking-[0.12em] uppercase text-faint mb-1.5">{f.label}</div>
              <div className="text-[14px] text-ink">{f.value}</div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-[18px] text-[12px] text-muted leading-relaxed">
          Designation, department, manager and access level are set by an administrator. Ask your admin if any of this
          is wrong.
        </div>
      </section>

      <ProfileForm
        initial={{
          preferredName: user.preferredName ?? "",
          pronouns: user.pronouns ?? "",
          location: user.location ?? "",
          phone: user.phone ?? "",
          about: user.about ?? "",
          skills: user.skills ?? "",
        }}
      />
    </div>
  );
}
