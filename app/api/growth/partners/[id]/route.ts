import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const partner = await prisma.partnerCompany.findUnique({
    where: { id: params.id },
    include: { interactions: { orderBy: { date: "desc" } } },
  });
  if (!partner) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(partner);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const d = await req.json();
  if (d.firstContactDate) d.firstContactDate = new Date(d.firstContactDate);
  if (d.lastInteractionDate) d.lastInteractionDate = new Date(d.lastInteractionDate);

  const before = await prisma.partnerCompany.findUnique({ where: { id: params.id } });
  const updated = await prisma.partnerCompany.update({ where: { id: params.id }, data: d });

  // Quando muda para parceria_activa, criar tarefa de follow-up trimestral
  if (before?.status !== "parceria_activa" && updated.status === "parceria_activa") {
    const next = new Date(); next.setMonth(next.getMonth() + 3);
    await prisma.task.create({
      data: {
        projectId: "unreal",
        title: `Follow-up trimestral com ${updated.name}`,
        status: "aberta",
        priority: "normal",
        dueDate: next,
        notes: `Auto-criada quando parceria activou. Partner ID: ${updated.id}`,
      },
    }).catch(() => null);
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.partnerInteraction.deleteMany({ where: { partnerId: params.id } });
  await prisma.partnerCompany.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
