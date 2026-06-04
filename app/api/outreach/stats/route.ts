import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") || "thefacio";

  const all = await prisma.lead.findMany({ where: { projectId }, select: { status: true } });
  const byStatus: Record<string, number> = {};
  for (const l of all) byStatus[l.status] = (byStatus[l.status] || 0) + 1;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const sentToday = await prisma.contactLog.count({
    where: { lead: { projectId }, channel: "whatsapp", direction: "out", date: { gte: todayStart } },
  });

  const inboundTotal = await prisma.contactLog.count({
    where: { lead: { projectId }, direction: "in" },
  });
  const outboundTotal = await prisma.contactLog.count({
    where: { lead: { projectId }, direction: "out" },
  });
  const responseRate = outboundTotal > 0 ? inboundTotal / outboundTotal : 0;

  const sent = ["m1-enviada", "m2-enviada", "m3-enviada", "m4-enviada"].reduce((s, k) => s + (byStatus[k] || 0), 0);
  const responded = byStatus["respondeu"] || 0;
  const negotiating = byStatus["negociacao"] || 0;
  const closed = byStatus["ganho"] || 0;
  const lost = byStatus["perdido"] || 0;
  const dormant = byStatus["dormente"] || 0;

  return NextResponse.json({
    total: all.length,
    byStatus,
    sentToday,
    responseRate,
    sent,
    responded,
    negotiating,
    closed,
    lost,
    dormant,
    suspeitos: byStatus["suspeito"] || 0,
  });
}
