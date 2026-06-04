import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const partners = await prisma.partnerCompany.findMany({
    include: { interactions: { orderBy: { date: "desc" } } },
    orderBy: [{ fitScore: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  const d = await req.json();
  return NextResponse.json(await prisma.partnerCompany.create({
    data: {
      name: d.name,
      contactName: d.contactName || "",
      contactRole: d.contactRole || null,
      email: d.email || null,
      linkedinUrl: d.linkedinUrl || null,
      type: d.type || "consultora",
      fitScore: d.fitScore ?? null,
      notes: d.notes || null,
      status: d.status || "a_abordar",
    },
  }));
}
