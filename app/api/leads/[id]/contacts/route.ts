import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const log = await prisma.contactLog.create({
    data: {
      leadId: params.id,
      channel: data.channel || "linkedin",
      direction: data.direction || "out",
      date: data.date ? new Date(data.date) : new Date(),
      content: data.content || "",
    },
  });
  return NextResponse.json(log);
}
