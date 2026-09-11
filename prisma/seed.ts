import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function quarterLabelFor(date: Date) {
  const q = Math.floor(date.getUTCMonth() / 3) + 1;
  return `Q${q}-${date.getUTCFullYear()}`;
}

function quarterRange(label: string) {
  const match = label.match(/^Q(\d)-(\d{4})$/);
  if (!match) throw new Error(`bad quarter label: ${label}`);
  const q = Number(match[1]);
  const year = Number(match[2]);
  const startMonth = (q - 1) * 3;
  const startDate = new Date(Date.UTC(year, startMonth, 1));
  const endDate = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59));
  return { startDate, endDate };
}

async function seedQuarters() {
  const now = new Date();
  const currentLabel = quarterLabelFor(now);

  const labels: string[] = [];
  let cursor = now;
  for (let i = 0; i < 4; i++) {
    labels.push(quarterLabelFor(cursor));
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - 3, 1));
  }

  const quarters: Record<string, { id: string }> = {};
  for (const label of labels) {
    const { startDate, endDate } = quarterRange(label);
    const q = await prisma.quarter.upsert({
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
    quarters[label] = q;
  }
  return { currentLabel, quarters };
}

async function main() {
  const { currentLabel, quarters } = await seedQuarters();
  const currentQuarterId = quarters[currentLabel].id;

  // --- Sample org (clearly-labeled demo data — safe to edit/delete from
  // Manage Users once real people have signed in with Google). ---

  const ceo = await prisma.user.upsert({
    where: { email: "ceo@example.com" },
    update: {},
    create: {
      email: "ceo@example.com",
      name: "Jordan Blake",
      role: "CEO",
      designation: "Chief Executive Officer",
      department: "Leadership",
      accessLevel: "Company-wide (read-only)",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Devon Reyes",
      role: "ADMIN",
      designation: "Systems Administrator",
      department: "IT Operations",
      accessLevel: "Full (Manage users)",
      managerId: ceo.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      name: "Priya Anand",
      role: "MANAGER",
      designation: "Engineering Manager",
      department: "Product Engineering",
      accessLevel: "Team",
      managerId: ceo.id,
    },
  });

  const reportsData = [
    { email: "sam.oyelaran@example.com", name: "Sam Oyelaran" },
    { email: "nora.haddad@example.com", name: "Nora Haddad" },
    { email: "ivan.petrov@example.com", name: "Ivan Petrov" },
    { email: "lena.fischer@example.com", name: "Lena Fischer" },
    { email: "tom.bracewell@example.com", name: "Tom Bracewell" },
  ];

  const reports = [];
  for (const r of reportsData) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        name: r.name,
        role: "EMPLOYEE",
        designation: "Individual Contributor",
        department: "Product Engineering",
        accessLevel: "Standard",
        managerId: manager.id,
      },
    });
    reports.push(user);
  }

  const [sam, nora, ivan, lena, tom] = reports;

  async function createGoal(
    owner: { id: string },
    data: {
      category: "INDIVIDUAL" | "TEAM" | "ORGANIZATIONAL";
      title: string;
      description: string;
      status: "NOT_STARTED" | "IN_PROGRESS" | "AT_RISK" | "COMPLETED";
      confidence: number;
      keyResults: { description: string; unit?: string; current: number; target: number }[];
      remarks?: { authorId: string; text: string }[];
    }
  ) {
    const existing = await prisma.goal.findFirst({
      where: { ownerId: owner.id, quarterId: currentQuarterId, title: data.title },
    });
    if (existing) return existing;

    return prisma.goal.create({
      data: {
        ownerId: owner.id,
        quarterId: currentQuarterId,
        category: data.category,
        title: data.title,
        description: data.description,
        status: data.status,
        confidence: data.confidence,
        keyResults: {
          create: data.keyResults.map((kr, order) => ({ ...kr, order })),
        },
        remarks: data.remarks?.length ? { create: data.remarks } : undefined,
      },
    });
  }

  await createGoal(sam, {
    category: "INDIVIDUAL",
    title: "Rebuild the first-run experience",
    description:
      "New empty states, a template picker, and a three-step setup that ends with a real goal created.",
    status: "IN_PROGRESS",
    confidence: 8,
    keyResults: [
      { description: "Setup completion", unit: "%", current: 62, target: 80 },
      { description: "Drop-off at step 2", unit: "%", current: 21, target: 10 },
    ],
    remarks: [
      {
        authorId: manager.id,
        text: "Step 2 drop-off is the whole game. Can we test removing the workspace question entirely?",
      },
    ],
  });

  await createGoal(sam, {
    category: "TEAM",
    title: "Goal templates library",
    description: "Twelve starter templates covering the most common quarterly patterns.",
    status: "AT_RISK",
    confidence: 4,
    keyResults: [{ description: "Templates shipped", current: 3, target: 12 }],
    remarks: [
      {
        authorId: manager.id,
        text: "Behind pace. Let's cut to six templates and ship, rather than hold all twelve.",
      },
    ],
  });

  await createGoal(nora, {
    category: "INDIVIDUAL",
    title: "Own the check-in notification redesign",
    description: "Replace the weekly email blast with targeted in-app nudges.",
    status: "COMPLETED",
    confidence: 10,
    keyResults: [{ description: "Check-in compliance", unit: "%", current: 91, target: 85 }],
  });

  await createGoal(nora, {
    category: "ORGANIZATIONAL",
    title: "Migrate billing services",
    description: "Move invoicing and dunning onto the new runtime.",
    status: "IN_PROGRESS",
    confidence: 7,
    keyResults: [{ description: "Services migrated", current: 7, target: 9 }],
  });

  await createGoal(ivan, {
    category: "TEAM",
    title: "Retire the legacy scheduler",
    description: "The cutover depends on two services that have not been migrated yet.",
    status: "AT_RISK",
    confidence: 3,
    keyResults: [
      { description: "Endpoints retired", current: 9, target: 24 },
      { description: "Cutover rehearsals", current: 1, target: 3 },
    ],
    remarks: [
      {
        authorId: manager.id,
        text: "Stalled two weeks. Bring a recovery plan Thursday, or we move the date publicly.",
      },
    ],
  });

  await createGoal(lena, {
    category: "INDIVIDUAL",
    title: "Ship the reporting export",
    description: "CSV and PDF export for quarterly scoring packets.",
    status: "IN_PROGRESS",
    confidence: 6,
    keyResults: [{ description: "Formats shipped", current: 1, target: 2 }],
  });

  await createGoal(lena, {
    category: "TEAM",
    title: "Cut page weight 30%",
    description: "Dashboard is the slowest page in the product on mid-tier hardware.",
    status: "NOT_STARTED",
    confidence: 5,
    keyResults: [{ description: "Bundle size", unit: "KB", current: 980, target: 686 }],
  });

  await createGoal(tom, {
    category: "ORGANIZATIONAL",
    title: "Run the quarterly scoring workshop",
    description: "Facilitate scoring for all five teams in one session.",
    status: "COMPLETED",
    confidence: 10,
    keyResults: [{ description: "Teams scored", current: 5, target: 5 }],
  });

  // Priya's own goals (as an employee of the CEO)
  await createGoal(manager, {
    category: "TEAM",
    title: "Lift new-user activation to 55%",
    description: "Activation is the biggest lever on retention this year.",
    status: "IN_PROGRESS",
    confidence: 8,
    keyResults: [
      { description: "Day-1 activation", unit: "%", current: 49, target: 55 },
      { description: "Onboarding completion", unit: "%", current: 71, target: 85 },
    ],
    remarks: [
      { authorId: ceo.id, text: "Flagging this in the leadership review as the team win of the quarter so far." },
    ],
  });

  // CEO's company-level goals
  await createGoal(ceo, {
    category: "ORGANIZATIONAL",
    title: "Reach a $40M ARR run rate",
    description: "Growth has to come from mid-market expansion rather than headcount in sales.",
    status: "IN_PROGRESS",
    confidence: 6,
    keyResults: [
      { description: "ARR run rate", unit: "$M", current: 34, target: 40 },
      { description: "Net revenue retention", unit: "%", current: 108, target: 115 },
    ],
  });

  await createGoal(ceo, {
    category: "ORGANIZATIONAL",
    title: "Open the second regional office",
    description: "Lease signed, first ten hires onboarded.",
    status: "IN_PROGRESS",
    confidence: 7,
    keyResults: [{ description: "Hires onboarded", current: 4, target: 10 }],
  });

  await createGoal(ceo, {
    category: "ORGANIZATIONAL",
    title: "Complete the SOC 2 Type II audit",
    description: "Close the remaining control gaps ahead of the renewal window.",
    status: "AT_RISK",
    confidence: 5,
    keyResults: [{ description: "Controls closed", current: 38, target: 45 }],
  });

  console.log("Seed complete.");
  console.log(`Current quarter: ${currentLabel}`);
  console.log("Sample accounts: ceo@example.com, manager@example.com, sam.oyelaran@example.com, ...");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
