import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const where = projectId && projectId !== "global" ? { projectId } : {};
  return NextResponse.json(await prisma.task.findMany({ where, orderBy: { createdAt: "desc" } }));
}

export async function POST(req: NextRequest) {
  const d = await req.json();
  return NextResponse.json(
    await prisma.task.create({
      data: {
        projectId: d.projectId,
        title: d.title,
        status: d.status || "aberta",
        priority: d.priority || "normal",
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        notes: d.notes || null,
      },
    })
  );
}

export async function PATCH(req: NextRequest) {
  const d = await req.json();
  return NextResponse.json(
    await prisma.task.update({
      where: { id: d.id },
      data: { status: d.status, priority: d.priority, title: d.title },
    })
  );
}
