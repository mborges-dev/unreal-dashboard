import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyEngagementDefaults } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const { leadId, note } = (await req.json()) as { leadId: string; note?: string };
  if (!leadId) return NextResponse.json({ error: "missing leadId" }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const defaults = applyEngagementDefaults(lead, "respondeu");
  const content = note?.trim() ? `[Respondeu] ${note.trim()}` : `[Respondeu]`;

  const today = new Date(); today.setHours(9, 0, 0, 0);

  await prisma.$transaction([
    prisma.contactLog.create({
      data: { leadId, channel: "whatsapp", direction: "in", date: new Date(), content },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: {
        ...defaults,
        status: "respondeu",
        temperature: "quente",
        nextDate: today,
        nextAction: "Enviar M3 - pitch + link demo",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, defaultsApplied: defaults });
}
