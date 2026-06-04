import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const where = type ? { type } : {};
  const outlets = await prisma.mediaOutlet.findMany({
    where,
    include: { pitches: { orderBy: { date: "desc" } } },
    orderBy: [{ fitScore: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(outlets);
}

export async function POST(req: NextRequest) {
  const d = await req.json();
  return NextResponse.json(await prisma.mediaOutlet.create({
    data: {
      type: d.type || "imprensa",
      name: d.name,
      editorialContact: d.editorialContact || null,
      host: d.host || null,
      url: d.url || null,
      audienceSize: d.audienceSize || null,
      fitScore: d.fitScore ?? null,
      notes: d.notes || null,
      status: d.status || "identificado",
    },
  }));
}
