import { prisma } from "@/lib/prisma";
import { getCurrentQuarter } from "@/lib/quarters";

export async function resolveQuarter(requestedLabel?: string) {
  if (requestedLabel) {
    const q = await prisma.quarter.findUnique({ where: { label: requestedLabel } });
    if (q) return q;
  }
  const current = await getCurrentQuarter();
  if (!current) throw new Error("No quarters exist yet — run the seed script or visit any app page once.");
  return current;
}
