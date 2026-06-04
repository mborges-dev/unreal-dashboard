import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json(await prisma.contentTemplate.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(req: NextRequest) {
  const d = await req.json();
  return NextResponse.json(await prisma.contentTemplate.create({
    data: { name: d.name, format: d.format, structure: d.structure, description: d.description || null },
  }));
}
