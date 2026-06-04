import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { probabilityFor, type Stage } from "@/lib/freelance";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lead = await prisma.freelanceLead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const data: any = await req.json();
  // Quando muda stage e probability não foi explicitamente enviado → atribui padrão
  if (data.stage && data.probability === undefined) {
    data.probability = probabilityFor(data.stage as Stage);
  }
  // Auto-fill appliedAt quando passa para applied pela primeira vez
  if (data.stage === "applied" && !data.appliedAt) {
    const cur = await prisma.freelanceLead.findUnique({ where: { id: params.id } });
    if (cur && !cur.appliedAt) data.appliedAt = new Date();
  }
  // Outcome auto
  if (data.stage === "won" && !data.outcome) data.outcome = "won";
  if (data.stage === "lost" && !data.outcome) data.outcome = "lost";
  if (data.nextActionDate) data.nextActionDate = new Date(data.nextActionDate);
  if (data.appliedAt) data.appliedAt = new Date(data.appliedAt);
  const lead = await prisma.freelanceLead.update({ where: { id: params.id }, data });
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.freelanceLead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
