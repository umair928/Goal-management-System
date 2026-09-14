import { requireSession } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { initialsFor } from "@/lib/status";
import { ProfileForm } from "./profile-form";
import styles from "./profile.module.css";

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
    <div className={styles.page}>
      <div className={styles.identity}>
        <div className={styles.avatar}>{initialsFor(user.name, user.email)}</div>
        <div>
          <h1 className={styles.name}>{user.name ?? user.email}</h1>
          <div className={styles.role}>{ROLE_LABELS[user.role]}</div>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>Assigned by your administrator</div>
          <div className={styles.badge}>Read-only</div>
        </div>
        <div className={styles.assignedGrid}>
          {assignedFields.map((f) => (
            <div key={f.label}>
              <div className={styles.assignedLabel}>{f.label}</div>
              <div className={styles.assignedValue}>{f.value}</div>
            </div>
          ))}
        </div>
        <div className={styles.assignedFootnote}>
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
