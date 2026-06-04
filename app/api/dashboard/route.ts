import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") || "unreal";
  const [leads, revenues, expenses, tasks] = await Promise.all([
    prisma.lead.findMany({ where: { projectId } }),
    prisma.revenue.findMany({ where: { projectId } }),
    prisma.expense.findMany({ where: { projectId } }),
    prisma.task.findMany({ where: { projectId, status: { not: "concluida" } }, orderBy: { dueDate: "asc" }, take: 5 }),
  ]);

  const now = new Date();
  const active = leads.filter((l) => !["suspeito", "ganho", "perdido", "dormente"].includes(l.status));
  const pipeline = active.reduce((s, l) => s + (l.expectedRevenue || 0), 0);
  const won = revenues.filter((r) => r.status === "paga").reduce((s, r) => s + r.amount, 0);
  const overdue = leads.filter((l) => l.nextDate && new Date(l.nextDate) < now && !["ganho", "perdido"].includes(l.status));
  const meetings = leads.filter((l) => l.status === "reuniao-marcada").length;
  const monthlyExp = expenses.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0);
  const balance = revenues.filter((r) => r.status === "paga").reduce((s, r) => s + r.amount, 0) - expenses.reduce((s, e) => s + e.amount, 0);
  const runway = monthlyExp > 0 ? balance / monthlyExp : null;

  const topLeads = [...active].sort((a, b) => (b.expectedRevenue || 0) - (a.expectedRevenue || 0)).slice(0, 5);
  const nextActions = [...leads]
    .filter((l) => l.nextDate && !["suspeito", "ganho", "perdido", "dormente"].includes(l.status))
    .sort((a, b) => +new Date(a.nextDate!) - +new Date(b.nextDate!))
    .slice(0, 5);

  const STATUS_ORDER = ["novo", "qualificado", "em-conversa", "reuniao-marcada", "proposta-enviada", "negociacao", "ganho"];
  const byStatus = STATUS_ORDER.map((s) => ({ name: s, value: leads.filter((l) => l.status === s).length }));
  const bySector: Record<string, number> = {};
  for (const l of leads) bySector[l.sector || "—"] = (bySector[l.sector || "—"] || 0) + (l.expectedRevenue || 0);
  const sectorData = Object.entries(bySector).map(([name, value]) => ({ name, value }));

  const months: { name: string; pipeline: number; receita: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const p2 = leads.filter((l) => l.createdAt.toISOString().slice(0, 7) <= key && !["ganho", "perdido"].includes(l.status)).reduce((s, l) => s + (l.expectedRevenue || 0), 0);
    const r2 = revenues.filter((rv) => rv.issuedAt.toISOString().slice(0, 7) === key).reduce((s, rv) => s + rv.amount, 0);
    months.push({ name: d.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" }), pipeline: p2, receita: r2 });
  }

  return NextResponse.json({
    kpis: { active: active.length, pipeline, won, overdue: overdue.length, meetings, runway },
    topLeads, nextActions, tasks,
    byStatus, sectorData, months,
  });
}
