import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function computeExpected(setup: number | null, monthly: number | null, prob: number | null) {
  const s = setup || 0;
  const m = (monthly || 0) * 12;
  const p = prob == null ? 0.3 : prob;
  return Math.round((s + m) * p);
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const includeSuspeitos = req.nextUrl.searchParams.get("includeSuspeitos") === "1";
  const baseWhere: any = projectId && projectId !== "global" ? { projectId } : {};
  const where = includeSuspeitos ? baseWhere : { ...baseWhere, status: { not: "suspeito" } };
  const [leads, suspeitosCount] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { updatedAt: "desc" } }),
    prisma.lead.count({ where: { ...baseWhere, status: "suspeito" } }),
  ]);
  return NextResponse.json(leads, { headers: { "x-suspeitos-count": String(suspeitosCount) } });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const expectedRevenue = computeExpected(data.setupValue, data.monthlyValue, data.probability);
  const lead = await prisma.lead.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      company: data.company || null,
      role: data.role || null,
      sector: data.sector || null,
      size: data.size || null,
      status: data.status || "novo",
      temperature: data.temperature || null,
      email: data.email || null,
      phone: data.phone || null,
      linkedinUrl: data.linkedinUrl || null,
      location: data.location || null,
      setupValue: data.setupValue ?? null,
      monthlyValue: data.monthlyValue ?? null,
      probability: data.probability ?? 0.3,
      expectedRevenue,
      nextAction: data.nextAction || null,
      nextDate: data.nextDate ? new Date(data.nextDate) : null,
      tags: data.tags || null,
      notes: data.notes || null,
      rawConversation: data.rawConversation || null,
    },
  });
  return NextResponse.json(lead);
}
