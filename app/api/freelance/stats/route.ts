import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STAGES, WEIGHTED_STAGES, MONTHLY_GOAL_EUR, probabilityFor, type Stage } from "@/lib/freelance";

export async function GET() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const all = await prisma.freelanceLead.findMany();
  const active = all.filter((l) => ACTIVE_STAGES.includes(l.stage as Stage));
  const won = all.filter((l) => l.stage === "won");
  const wonThisMonth = won.filter((l) => l.updatedAt >= monthStart);
  const earnedThisMonth = wonThisMonth.reduce((s, l) => s + (l.estValueEur || 0), 0);

  const appliedThisMonth = all.filter((l) => l.appliedAt && l.appliedAt >= monthStart).length;
  const applied = all.filter((l) => l.appliedAt != null).length;
  const replied = all.filter((l) => ["replied", "call_scheduled", "proposal_sent", "won"].includes(l.stage)).length;
  const responseRate = applied > 0 ? replied / applied : 0;
  const winRate = replied > 0 ? won.length / replied : 0;

  // Pipeline ponderado (replied + call + proposal apenas)
  const pipelineWeighted = all
    .filter((l) => WEIGHTED_STAGES.includes(l.stage as Stage))
    .reduce((s, l) => s + (l.estValueEur || 0) * (l.probability ?? probabilityFor(l.stage as Stage)), 0);

  const pipelineGross = active.reduce((s, l) => s + (l.estValueEur || 0), 0);

  // Funil — contagens por stage
  const funnel: Record<string, number> = {};
  for (const l of all) funnel[l.stage] = (funnel[l.stage] || 0) + 1;

  // Hoje — leads com next_action_date <= today AND outcome null
  const today = all
    .filter((l) => l.outcome == null && l.nextActionDate && l.nextActionDate <= todayEnd)
    .sort((a, b) => (a.nextActionDate!.getTime()) - (b.nextActionDate!.getTime()));

  // Tarefas Freelance pendentes para hoje
  const todayTasks = await prisma.task.findMany({
    where: { projectId: "freelance", status: { not: "concluida" }, dueDate: { lte: todayEnd } },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({
    goal: MONTHLY_GOAL_EUR,
    earnedThisMonth,
    progressPct: Math.min(100, Math.round((earnedThisMonth / MONTHLY_GOAL_EUR) * 100)),
    pipelineWeighted: Math.round(pipelineWeighted),
    pipelineGross,
    applied,
    appliedThisMonth,
    replied,
    won: won.length,
    lost: all.filter((l) => l.stage === "lost").length,
    active: active.length,
    responseRate,
    winRate,
    funnel,
    today: today.map((l) => ({
      id: l.id, projectTitle: l.projectTitle, platform: l.platform, stage: l.stage,
      nextAction: l.nextAction, nextActionDate: l.nextActionDate,
      estValueEur: l.estValueEur,
    })),
    todayTasks: todayTasks.map((t) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate })),
  });
}
