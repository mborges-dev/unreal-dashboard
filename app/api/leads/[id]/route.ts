import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyEngagementDefaults } from "@/lib/pricing";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { contacts: { orderBy: { date: "asc" } }, proposals: true },
  });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let data = await req.json();
  const cur = await prisma.lead.findUnique({ where: { id: params.id } });
  if (cur) {
    // Se o estado muda, aplica defaults do tier + probabilidade do estado
    if (data.status && data.status !== cur.status) {
      const merged = { ...cur, ...data };
      const defaults = applyEngagementDefaults(merged, data.status);
      data = { ...defaults, ...data, expectedRevenue: defaults.expectedRevenue };
    } else if ("setupValue" in data || "monthlyValue" in data || "probability" in data) {
      const setup = data.setupValue ?? cur.setupValue ?? 0;
      const monthly = data.monthlyValue ?? cur.monthlyValue ?? 0;
      const prob = data.probability ?? cur.probability ?? 0.3;
      data.expectedRevenue = Math.round((setup + monthly * 12) * prob);
    }
  }
  if (data.nextDate) data.nextDate = new Date(data.nextDate);
  const lead = await prisma.lead.update({ where: { id: params.id }, data });
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.contactLog.deleteMany({ where: { leadId: params.id } });
  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
