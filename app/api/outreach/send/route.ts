import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUS_AFTER, TEMPLATES, type MsgKey } from "@/lib/outreach";

export async function POST(req: NextRequest) {
  const { leadId, msg, note } = (await req.json()) as { leadId: string; msg: MsgKey; note?: string };
  if (!leadId || !STATUS_AFTER[msg]) return NextResponse.json({ error: "bad input" }, { status: 400 });

  const newStatus = STATUS_AFTER[msg];
  const content = note ? `[${msg}] ${TEMPLATES[msg]}\n\n— ${note}` : `[${msg}] ${TEMPLATES[msg]}`;

  await prisma.$transaction([
    prisma.contactLog.create({
      data: { leadId, channel: "whatsapp", direction: "out", date: new Date(), content },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: { status: newStatus, nextAction: msg === "M4" ? null : `Enviar ${nextMsg(msg)}`, nextDate: msg === "M4" ? null : computeNext(msg) },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

function nextMsg(m: MsgKey): MsgKey | "" {
  return ({ M1: "M2", M2: "M3", M3: "M4", M4: "" } as const)[m];
}
function computeNext(m: MsgKey): Date {
  const days = ({ M1: 3, M2: 3, M3: 4, M4: 0 } as const)[m];
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0);
  return d;
}
