import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEMPLATES, NEXT_DAYS_AFTER, type UnrealBump } from "@/lib/unreal-outreach";

export async function POST(req: NextRequest) {
  const { leadId, bump, channel, note } = (await req.json()) as {
    leadId: string;
    bump: UnrealBump;
    channel?: string;
    note?: string;
  };
  if (!leadId || !TEMPLATES[bump]) return NextResponse.json({ error: "bad input" }, { status: 400 });

  const ch = channel || "linkedin";
  const tag = bump === "BREAKUP" ? "Break-up" : bump === "BUMP1" ? "Bump 1" : "Bump 2";
  const content = note?.trim() ? `[${tag}] ${note.trim()}` : `[${tag}] enviado.`;

  // Status flow:
  // BUMP1: novo -> em-conversa
  // BUMP2: em-conversa -> em-conversa (no change)
  // BREAKUP: em-conversa -> em-conversa (await reply; if none, dormente later)
  const newStatus = bump === "BUMP1" ? "em-conversa" : "em-conversa";

  const next = new Date(); next.setDate(next.getDate() + NEXT_DAYS_AFTER[bump]); next.setHours(9, 0, 0, 0);
  const nextAction =
    bump === "BUMP1" ? "Se silêncio até esta data → enviar Bump 2" :
    bump === "BUMP2" ? "Se silêncio até esta data → enviar Break-up" :
    "Se silêncio até esta data → mover para dormente";

  await prisma.$transaction([
    prisma.contactLog.create({
      data: { leadId, channel: ch, direction: "out", date: new Date(), content },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: { status: newStatus, nextDate: next, nextAction },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
