import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAY = 86400000;

export async function GET(_req: NextRequest) {
  const projectId = "unreal";
  const now = Date.now();

  // Bump 1: status='novo' (1ª enviada, sem resposta)
  const bump1Raw = await prisma.lead.findMany({
    where: { projectId, status: "novo" },
    include: { contacts: { orderBy: { date: "desc" }, take: 5 } },
    orderBy: { nextDate: "asc" },
  });
  const bump1 = bump1Raw.filter((l) => l.contacts.filter((c) => c.direction === "in").length === 0);

  // Bump 2: status='em-conversa' AND last_out >= 7d AND no inbound contacts
  // Break-up: status='em-conversa' AND last_out >= 14d AND no inbound contacts
  const inConvRaw = await prisma.lead.findMany({
    where: { projectId, status: "em-conversa" },
    include: { contacts: { orderBy: { date: "desc" } } },
  });
  const inConvNoReply = inConvRaw.filter((l) => l.contacts.filter((c) => c.direction === "in").length === 0);

  const lastOutDays = (l: typeof inConvNoReply[number]) => {
    const lastOut = l.contacts.find((c) => c.direction === "out");
    if (!lastOut) return 999;
    return Math.floor((now - new Date(lastOut.date).getTime()) / DAY);
  };

  const bump2 = inConvNoReply.filter((l) => {
    const d = lastOutDays(l);
    return d >= 7 && d < 14;
  });
  const breakup = inConvNoReply.filter((l) => lastOutDays(l) >= 14);

  // Sent today (any out from UNREAL today)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const sentToday = await prisma.contactLog.count({
    where: { lead: { projectId }, direction: "out", date: { gte: todayStart } },
  });

  const strip = (l: any) => ({
    id: l.id,
    name: l.name,
    company: l.company,
    sector: l.sector,
    role: l.role,
    linkedinUrl: l.linkedinUrl,
    email: l.email,
    status: l.status,
    notes: l.notes,
    nextDate: l.nextDate,
    lastContact: l.contacts?.[0]?.date || null,
    lastContactContent: l.contacts?.[0]?.content || null,
    daysSinceLastOut: lastOutDays(l),
  });

  return NextResponse.json({
    BUMP1: bump1.map(strip),
    BUMP2: bump2.map(strip),
    BREAKUP: breakup.map(strip),
    sentToday,
  });
}
