import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { resolveQuarter } from "@/lib/resolve-quarter";
import { prisma } from "@/lib/prisma";
import { CATEGORY_COLORS, CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLE, computeGoalProgress, formatDateTime, initialsFor, pluralize } from "@/lib/status";
import { RemarkComposer } from "./remark-composer";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; person?: string }>;
}) {
  const session = await requireSession();
  if (session.user.role !== "MANAGER") redirect("/goals");

  const params = await searchParams;
  const quarter = await resolveQuarter(params.q);

  const reports = await prisma.user.findMany({
    where: { managerId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      goals: {
        where: { quarterId: quarter.id },
        include: { keyResults: true },
      },
    },
  });

  const roster = reports.map((r) => {
    const avg =
      r.goals.length === 0
        ? null
        : Math.round(r.goals.reduce((sum, g) => sum + computeGoalProgress(g.keyResults), 0) / r.goals.length);
    const atRisk = r.goals.some((g) => g.status === "AT_RISK");
    return { ...r, avg, atRisk };
  });

  const selectedId = params.person && roster.some((r) => r.id === params.person) ? params.person : roster[0]?.id;
  const selected = roster.find((r) => r.id === selectedId) ?? null;

  const selectedGoals = selected
    ? await prisma.goal.findMany({
        where: { ownerId: selected.id, quarterId: quarter.id },
        include: {
          keyResults: { orderBy: { order: "asc" } },
          remarks: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const qParam = `q=${encodeURIComponent(quarter.label)}`;

  return (
    <div className="max-w-[1180px] mx-auto flex flex-wrap gap-5 items-start">
      <aside className="flex-[2_1_250px] min-w-0 bg-card border border-border rounded-[10px]">
        <div className="px-4 py-3.5 border-b border-border-soft font-heading text-[10px] tracking-[0.12em] uppercase text-muted">
          Direct reports
        </div>
        {roster.length === 0 && <div className="px-4 py-4 text-[13px] text-muted">No direct reports yet.</div>}
        {roster.map((r) => (
          <Link
            key={r.id}
            href={`/team?${qParam}&person=${r.id}`}
            className="w-full grid items-center gap-2.5 px-4 py-3 border-b border-border-softer no-underline text-ink"
            style={{
              gridTemplateColumns: "30px minmax(0,1fr) auto",
              borderLeft: `3px solid ${r.atRisk ? "#A8412C" : "transparent"}`,
              background: r.id === selectedId ? "#F5F7FA" : "transparent",
            }}
          >
            <span className="w-[30px] h-[30px] bg-border-soft rounded-full grid place-items-center font-heading text-[10px]">
              {initialsFor(r.name, r.email)}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">{r.name ?? r.email}</span>
              <span className="block font-heading text-[10px] text-muted mt-1">
                {pluralize(r.goals.length, "goal")} · {r.avg === null ? "—" : `${r.avg}%`}
              </span>
            </span>
            <span className="font-heading text-[10px]" style={{ color: r.atRisk ? "#A8412C" : "transparent" }}>
              {r.atRisk ? "At risk" : ""}
            </span>
          </Link>
        ))}
      </aside>

      <div className="flex-[5_1_400px] min-w-0 grid gap-[18px]">
        {selected ? (
          <>
            <div className="flex items-baseline justify-between flex-wrap gap-2.5">
              <h1 className="font-heading font-semibold text-[19px] m-0 tracking-tight">{selected.name ?? selected.email}</h1>
              <div className="font-heading text-[11px] text-muted">
                {selected.avg === null ? "—" : `${selected.avg}%`} complete · {quarter.label} · review only
              </div>
            </div>

            {selectedGoals.length === 0 && (
              <div className="p-[18px] border border-dashed border-border-strong rounded-[10px] text-[13px] text-muted bg-card">
                No goals recorded for {quarter.label}.
              </div>
            )}

            {selectedGoals.map((g) => {
              const pct = computeGoalProgress(g.keyResults);
              const style = STATUS_STYLE[g.status];
              const firstName = (selected.name ?? selected.email).split(" ")[0];
              return (
                <article key={g.id} className="bg-card border border-border rounded-[10px]">
                  <div className="px-5 py-[18px] grid gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-[3px]" style={{ background: CATEGORY_COLORS[g.category] }} />
                      <span className="font-heading text-[9px] tracking-[0.1em] uppercase text-muted">
                        {CATEGORY_LABELS[g.category]}
                      </span>
                    </div>
                    <div className="font-heading font-semibold text-[16px] leading-[1.35]">{g.title}</div>
                    {g.description && <div className="text-[13px] text-muted leading-relaxed max-w-[60ch]">{g.description}</div>}
                    <div>
                      <div className="h-1.5 rounded-[3px] bg-border-soft">
                        <div className="h-1.5 rounded-[3px]" style={{ width: `${pct}%`, background: style.bar }} />
                      </div>
                      <div className="flex justify-between mt-1.5 font-heading text-[10px] text-muted">
                        <span>{pluralize(g.keyResults.length, "key result")}</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-heading text-[9px] tracking-[0.08em] uppercase px-2 py-1 rounded-full"
                        style={{ background: style.bg, color: style.fg }}
                      >
                        {STATUS_LABELS[g.status]}
                      </span>
                      <span className="font-heading text-[10px] px-2 py-1 border border-border-strong rounded-full text-chambray">
                        Confidence {g.confidence}/10
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border-soft bg-surface-alt px-5 py-4">
                    <div className="font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-3">Remarks</div>
                    {g.remarks.map((rm) => (
                      <div key={rm.text + rm.createdAt.toISOString()} className="border-l-2 border-border pl-3 mb-3.5">
                        <div className="font-heading text-[9px] tracking-[0.06em] text-muted mb-1">
                          {rm.author.name ?? rm.author.email} · {formatDateTime(rm.createdAt)}
                        </div>
                        <div className="text-[13px] leading-relaxed text-ink">{rm.text}</div>
                      </div>
                    ))}
                    <RemarkComposer goalId={g.id} firstName={firstName} />
                  </div>
                </article>
              );
            })}
          </>
        ) : (
          <div className="p-[18px] border border-dashed border-border-strong rounded-[10px] text-[13px] text-muted bg-card">
            No direct reports to review yet.
          </div>
        )}
      </div>
    </div>
  );
}
