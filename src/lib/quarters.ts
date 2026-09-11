import { prisma } from "@/lib/prisma";

export function quarterLabelFor(date: Date) {
  const q = Math.floor(date.getUTCMonth() / 3) + 1;
  return `Q${q}-${date.getUTCFullYear()}`;
}

function quarterRange(label: string): { startDate: Date; endDate: Date } {
  const [, qStr, yStr] = label.match(/^Q(\d)-(\d{4})$/)!;
  const q = Number(qStr);
  const year = Number(yStr);
  const startMonth = (q - 1) * 3;
  const startDate = new Date(Date.UTC(year, startMonth, 1));
  const endDate = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59));
  return { startDate, endDate };
}

/**
 * Ensures the calendar-current quarter (and the three before it, locked as
 * archive) exist in the database. Safe to call repeatedly — idempotent via
 * upsert on the unique quarter label.
 */
export async function ensureQuartersSeeded() {
  const now = new Date();
  const currentLabel = quarterLabelFor(now);

  const labels: string[] = [];
  let cursor = now;
  for (let i = 0; i < 4; i++) {
    labels.push(quarterLabelFor(cursor));
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - 3, 1));
  }

  for (const label of labels) {
    const { startDate, endDate } = quarterRange(label);
    await prisma.quarter.upsert({
      where: { label },
      update: {},
      create: {
        label,
        startDate,
        endDate,
        locked: label !== currentLabel,
        isCurrent: label === currentLabel,
      },
    });
  }
}

/** Lazily creates the calendar-current quarter row if it doesn't exist yet — keeps
 * the app self-maintaining across quarter boundaries without a cron job. */
export async function ensureCurrentQuarterExists() {
  const label = quarterLabelFor(new Date());
  const existing = await prisma.quarter.findUnique({ where: { label } });
  if (existing) return existing;

  await prisma.quarter.updateMany({ data: { isCurrent: false }, where: { isCurrent: true } });
  const { startDate, endDate } = quarterRange(label);
  return prisma.quarter.create({
    data: { label, startDate, endDate, locked: false, isCurrent: true },
  });
}

export async function getCurrentQuarter() {
  const current = await prisma.quarter.findFirst({ where: { isCurrent: true } });
  if (current) return current;
  // Fall back to the most recently started quarter if none is flagged current.
  return prisma.quarter.findFirst({ orderBy: { startDate: "desc" } });
}

export async function listQuarters() {
  return prisma.quarter.findMany({ orderBy: { startDate: "desc" } });
}
