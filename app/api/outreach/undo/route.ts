import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REVERT: Record<string, string> = {
  M1: "suspeito",
  M2: "m1-enviada",
  M3: "m2-enviada",
  M4: "m3-enviada",
};

export async function POST(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") || "thefacio";
  const last = await prisma.contactLog.findFirst({
    where: { channel: "whatsapp", direction: "out", lead: { projectId } },
    orderBy: { date: "desc" },
    include: { lead: true },
  });
  if (!last) return NextResponse.json({ error: "Nada para desfazer." }, { status: 404 });

  const msg = last.content.match(/^\[(M\d)\]/)?.[1];
  const prevStatus = msg ? REVERT[msg] : "suspeito";

  await prisma.$transaction([
    prisma.contactLog.delete({ where: { id: last.id } }),
    prisma.lead.update({
      where: { id: last.leadId },
      data: { status: prevStatus, nextDate: null, nextAction: null },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    lead: { id: last.leadId, name: last.lead.name },
    msg: msg || null,
    revertedTo: prevStatus,
  });
}
