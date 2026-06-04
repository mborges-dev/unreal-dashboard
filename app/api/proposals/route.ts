import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const where = projectId && projectId !== "global" ? { projectId } : {};
  const list = await prisma.proposal.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const d = await req.json();
  const totalYear = (d.setupValue || 0) + (d.monthlyValue || 0) * 12;
  const p = await prisma.proposal.create({
    data: {
      projectId: d.projectId,
      leadId: d.leadId || null,
      client: d.client,
      title: d.title,
      status: d.status || "rascunho",
      setupValue: d.setupValue ?? null,
      monthlyValue: d.monthlyValue ?? null,
      totalYear,
      sentAt: d.sentAt ? new Date(d.sentAt) : null,
      respondedAt: d.respondedAt ? new Date(d.respondedAt) : null,
      notes: d.notes || null,
    },
  });
  return NextResponse.json(p);
}
