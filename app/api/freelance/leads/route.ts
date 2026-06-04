import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { probabilityFor, type Stage } from "@/lib/freelance";

export async function GET(req: NextRequest) {
  const stage = req.nextUrl.searchParams.get("stage");
  const platform = req.nextUrl.searchParams.get("platform");
  const todayOnly = req.nextUrl.searchParams.get("today") === "1";

  const where: any = {};
  if (stage) where.stage = stage;
  if (platform) where.platform = platform;
  if (todayOnly) {
    where.outcome = null;
    where.nextActionDate = { lte: new Date(new Date().setHours(23, 59, 59, 999)) };
  }
  const leads = await prisma.freelanceLead.findMany({ where, orderBy: [{ nextActionDate: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const d = await req.json();
  const stage: Stage = d.stage || "identified";
  const probability = d.probability ?? probabilityFor(stage);
  const lead = await prisma.freelanceLead.create({
    data: {
      platform: d.platform || "malt",
      projectTitle: d.projectTitle,
      clientName: d.clientName || null,
      url: d.url || null,
      stage,
      estValueEur: d.estValueEur ?? null,
      rateType: d.rateType || null,
      appliedAt: d.appliedAt ? new Date(d.appliedAt) : (stage !== "identified" ? new Date() : null),
      nextAction: d.nextAction || null,
      nextActionDate: d.nextActionDate ? new Date(d.nextActionDate) : null,
      skillsMatch: d.skillsMatch || null,
      notes: d.notes || null,
      probability,
    },
  });
  return NextResponse.json(lead);
}
