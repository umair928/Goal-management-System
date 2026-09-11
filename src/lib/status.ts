import type { Category, GoalStatus } from "@/generated/prisma/enums";

export const CATEGORY_LABELS: Record<Category, string> = {
  INDIVIDUAL: "Individual",
  TEAM: "Team",
  ORGANIZATIONAL: "Organizational",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  INDIVIDUAL: "#455E7F",
  TEAM: "#0695C2",
  ORGANIZATIONAL: "#A980D5",
};

export const STATUS_LABELS: Record<GoalStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  AT_RISK: "At risk",
  COMPLETED: "Completed",
};

export const STATUS_STYLE: Record<GoalStatus, { bg: string; fg: string; bar: string }> = {
  NOT_STARTED: { bg: "#E6EBF2", fg: "#455E7F", bar: "#8A94A3" },
  IN_PROGRESS: { bg: "#E6ECF5", fg: "#22384F", bar: "#455E7F" },
  AT_RISK: { bg: "#FBF3E0", fg: "#4A3F22", bar: "#8A6A16" },
  COMPLETED: { bg: "#E3F2EE", fg: "#1E3B2C", bar: "#237C6E" },
};

export function computeGoalProgress(keyResults: { current: number; target: number }[]): number {
  if (keyResults.length === 0) return 0;
  const pcts = keyResults.map((kr) => {
    if (kr.target <= 0) return kr.current > 0 ? 100 : 0;
    return Math.min(100, Math.max(0, (kr.current / kr.target) * 100));
  });
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
}

export function pluralize(n: number, noun: string) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

export function initialsFor(name: string | null | undefined, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
