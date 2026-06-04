import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ideas = await prisma.contentIdea.findMany({ orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  const d = await req.json();
  const idea = await prisma.contentIdea.create({
    data: {
      title: d.title,
      hook: d.hook || null,
      angle: d.angle || null,
      format: d.format || "post_linkedin",
      pillar: d.pillar || null,
      tags: d.tags || null,
      status: d.status || "ideia",
      body: d.body || null,
      notes: d.notes || null,
    },
  });
  return NextResponse.json(idea);
}
