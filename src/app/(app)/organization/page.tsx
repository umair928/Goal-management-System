import { Fragment } from "react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { resolveQuarter } from "@/lib/resolve-quarter";
import { listQuarters } from "@/lib/quarters";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/session";
import { CATEGORY_LABELS, computeGoalProgress, formatDateTime } from "@/lib/status";
import type { Category } from "@/generated/prisma/enums";
import { RoleSelect } from "./role-select";
import { AuditSearch } from "./audit-search";
import { UserEditModal } from "./user-edit-modal";
import styles from "./organization.module.css";

const CATEGORY_ORDER: Category[] = ["INDIVIDUAL", "TEAM", "ORGANIZATIONAL"];

export default async function OrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; aq?: string; edit?: string }>;
}) {
  const session = await requireSession();
  if (session.user.role !== "CEO" && session.user.role !== "ADMIN") redirect("/goals");
  const isAdmin = session.user.role === "ADMIN";

  const params = await searchParams;
  const quarter = await resolveQuarter(params.q);
  const tab = params.tab === "audit" || params.tab === "users" ? params.tab : "overview";
  const qParam = `q=${encodeURIComponent(quarter.label)}`;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "audit", label: "Audit log" },
    { key: "users", label: "Manage users" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.tabRow}>
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/organization?${qParam}&tab=${t.key}`}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {tab === "overview" && <OverviewTab quarterId={quarter.id} quarterLabel={quarter.label} />}
      {tab === "audit" && <AuditTab query={params.aq ?? ""} />}
      {tab === "users" && (
        <UsersTab isAdmin={isAdmin} editUserId={params.edit} closeHref={`/organization?${qParam}&tab=users`} />
      )}
    </div>
  );
}

async function OverviewTab({ quarterId, quarterLabel }: { quarterId: string; quarterLabel: string }) {
  const goals = await prisma.goal.findMany({
    where: { quarterId },
    include: { keyResults: true, owner: { select: { department: true } } },
  });

  const avgCompletion = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + computeGoalProgress(g.keyResults), 0) / goals.length)
    : 0;
  const atRiskCount = goals.filter((g) => g.status === "AT_RISK").length;
  const completedCount = goals.filter((g) => g.status === "COMPLETED").length;

  const kpis = [
    { label: "Org-wide average completion", value: `${avgCompletion}%`, sub: quarterLabel, color: "#455E7F" },
    { label: "At-risk goals", value: String(atRiskCount), sub: "need attention", color: "#8A6A16" },
    { label: "Completed goals", value: String(completedCount), sub: "this quarter", color: "#237C6E" },
  ];

  const departments = Array.from(
    new Set(goals.map((g) => g.owner.department).filter((d): d is string => Boolean(d)))
  ).sort();

  const cells = departments.flatMap((dept) =>
    CATEGORY_ORDER.map((category) => {
      const cellGoals = goals.filter((g) => g.owner.department === dept && g.category === category);
      if (cellGoals.length === 0) return { dept, category, text: "—", bg: "#F5F7FA", fg: "#8A94A3" };
      const pct = Math.round(cellGoals.reduce((sum, g) => sum + computeGoalProgress(g.keyResults), 0) / cellGoals.length);
      const alpha = 0.08 + (pct / 100) * 0.42;
      return { dept, category, text: `${pct}%`, bg: `rgba(69, 94, 127, ${alpha.toFixed(2)})`, fg: "#22384F" };
    })
  );

  const trendQuarters = (await listQuarters()).slice(0, 4).reverse();
  const trendData = await Promise.all(
    trendQuarters.map(async (q) => {
      const qGoals = await prisma.goal.findMany({ where: { quarterId: q.id }, include: { keyResults: true } });
      const pct = qGoals.length
        ? Math.round(qGoals.reduce((sum, g) => sum + computeGoalProgress(g.keyResults), 0) / qGoals.length)
        : 0;
      return { label: q.label, pct };
    })
  );

  const n = trendData.length || 1;
  const points = trendData.map((d, i) => {
    const x = n === 1 ? 320 : 40 + i * (560 / (n - 1));
    const y = 160 - (d.pct / 100) * 130;
    return { ...d, x, y };
  });

  return (
    <div className={styles.tabPanel}>
      <div className={styles.kpiRow}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpiTile}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiValue} style={{ color: k.color }}>
              {k.value}
            </div>
            <div className={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelTitle}>Completion by team and category</div>
          <div className={styles.legend}>
            <span>0%</span>
            <span className={styles.legendBar} />
            <span>100%</span>
          </div>
        </div>
        {departments.length === 0 ? (
          <div className={styles.mutedNote}>No department data yet.</div>
        ) : (
          <div className={styles.heatmapGrid}>
            <div />
            {CATEGORY_ORDER.map((c) => (
              <div key={c} className={styles.heatmapColLabel}>
                {CATEGORY_LABELS[c]}
              </div>
            ))}
            {departments.map((dept) => (
              <Fragment key={dept}>
                <div className={styles.heatmapRowLabel}>{dept}</div>
                {CATEGORY_ORDER.map((c) => {
                  const cell = cells.find((x) => x.dept === dept && x.category === c)!;
                  return (
                    <div key={dept + c} className={styles.heatmapCell} style={{ background: cell.bg, color: cell.fg }}>
                      {cell.text}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelTitle} style={{ marginBottom: 18 }}>
          Completion trend · last {trendData.length} quarters
        </div>
        <svg viewBox="0 0 640 180" preserveAspectRatio="none" className={styles.trendChart}>
          <line x1="0" y1="30" x2="640" y2="30" stroke="#E6EBF2" strokeWidth={1} />
          <line x1="0" y1="75" x2="640" y2="75" stroke="#E6EBF2" strokeWidth={1} />
          <line x1="0" y1="120" x2="640" y2="120" stroke="#E6EBF2" strokeWidth={1} />
          <line x1="0" y1="160" x2="640" y2="160" stroke="#C7D1DF" strokeWidth={1} />
          <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#455E7F" strokeWidth={2} />
          {points.map((p) => (
            <circle key={p.label} cx={p.x} cy={p.y} r={4} fill="#455E7F" />
          ))}
        </svg>
        <div className={styles.trendLabels} style={{ gridTemplateColumns: `repeat(${points.length || 1}, 1fr)` }}>
          {points.map((p) => (
            <div key={p.label} className={styles.trendLabel}>
              <div className={styles.trendValue}>{p.pct}%</div>
              <div className={styles.trendQuarter}>{p.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function AuditTab({ query }: { query: string }) {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });

  const filtered = query
    ? rows.filter((r) => {
        const haystack = `${r.actor?.name ?? ""} ${r.actor?.email ?? ""} ${r.action} ${r.entity}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : rows;

  const actionColor = (action: string) => {
    if (/delete/i.test(action)) return "#A8412C";
    if (/role|assignment/i.test(action)) return "#8A6A16";
    return "#455E7F";
  };

  const gridCols = "150px 150px minmax(0,1fr) 150px";

  return (
    <section className={styles.panel} style={{ padding: 0 }}>
      <div className={styles.sectionHeadBar}>
        <div className={styles.panelTitle}>Audit log</div>
        <AuditSearch defaultValue={query} />
      </div>
      <div className={styles.tableHead} style={{ gridTemplateColumns: gridCols }}>
        <div>Actor</div>
        <div>Action</div>
        <div>Entity</div>
        <div className={styles.alignRight}>Timestamp</div>
      </div>
      {filtered.length === 0 && <div className={styles.emptyRow}>No matching entries.</div>}
      {filtered.map((row) => (
        <div key={row.id} className={styles.tableRow} style={{ gridTemplateColumns: gridCols }}>
          <div>{row.actor?.name ?? row.actor?.email ?? "System"}</div>
          <div className={styles.actionColor} style={{ color: actionColor(row.action) }}>
            {row.action}
          </div>
          <div className={styles.truncate}>
            {row.entity}
            {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}
          </div>
          <div className={`${styles.mutedSmall} ${styles.alignRight}`}>{formatDateTime(row.createdAt)}</div>
        </div>
      ))}
    </section>
  );
}

async function UsersTab({
  isAdmin,
  editUserId,
  closeHref,
}: {
  isAdmin: boolean;
  editUserId?: string;
  closeHref: string;
}) {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { manager: { select: { name: true } } },
  });

  const editing = editUserId ? users.find((u) => u.id === editUserId) : undefined;
  const managerOptions = users
    .filter((u) => u.id !== editing?.id)
    .map((u) => ({ id: u.id, name: u.name ?? u.email }));

  const gridCols = "minmax(0,1fr) 130px 130px 150px 90px";

  return (
    <section className={styles.panel} style={{ padding: 0 }}>
      <div className={styles.usersHeadBar}>
        <div className={styles.panelTitle}>Manage users</div>
        <div className={styles.badge}>{isAdmin ? "Admin — editable" : "Read-only for CEO"}</div>
      </div>
      <div className={styles.tableHead} style={{ gridTemplateColumns: gridCols }}>
        <div>User</div>
        <div>Role</div>
        <div>Team</div>
        <div>Manager</div>
        <div className={styles.alignRight}>Actions</div>
      </div>
      {users.map((u) => (
        <div key={u.id} className={styles.usersTableRow} style={{ gridTemplateColumns: gridCols }}>
          <div className={styles.userCellName}>
            <div className={styles.truncate}>{u.name ?? u.email}</div>
            <div className={`${styles.userEmail} ${styles.truncate}`}>{u.email}</div>
          </div>
          <div>
            {isAdmin ? (
              <RoleSelect userId={u.id} role={u.role} />
            ) : (
              <span className={styles.roleStatic}>{ROLE_LABELS[u.role]}</span>
            )}
          </div>
          <div className={`${styles.mutedCell} ${styles.truncate}`}>{u.department ?? "—"}</div>
          <div className={`${styles.mutedCell} ${styles.truncate}`}>{u.manager?.name ?? "—"}</div>
          <div className={styles.alignRight}>
            {isAdmin ? (
              <a href={`${closeHref}&edit=${u.id}`} className={styles.editLink}>
                Edit
              </a>
            ) : (
              <span className={styles.noActionCell}>—</span>
            )}
          </div>
        </div>
      ))}

      {isAdmin && editing && (
        <UserEditModal
          userId={editing.id}
          name={editing.name ?? editing.email}
          initial={{
            designation: editing.designation ?? "",
            department: editing.department ?? "",
            accessLevel: editing.accessLevel ?? "",
            managerId: editing.managerId,
          }}
          managers={managerOptions}
          closeHref={closeHref}
        />
      )}
    </section>
  );
}
