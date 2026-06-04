import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const where = projectId && projectId !== "global" ? { projectId } : {};
  const [revenues, expenses] = await Promise.all([
    prisma.revenue.findMany({ where, orderBy: { issuedAt: "desc" } }),
    prisma.expense.findMany({ where, orderBy: { date: "desc" } }),
  ]);
  return NextResponse.json({ revenues, expenses });
}

export async function POST(req: NextRequest) {
  const d = await req.json();
  if (d.kind === "revenue") {
    return NextResponse.json(
      await prisma.revenue.create({
        data: {
          projectId: d.projectId,
          client: d.client,
          amount: Number(d.amount),
          status: d.status || "pendente",
          issuedAt: d.issuedAt ? new Date(d.issuedAt) : new Date(),
          paidAt: d.paidAt ? new Date(d.paidAt) : null,
          notes: d.notes || null,
        },
      })
    );
  }
  return NextResponse.json(
    await prisma.expense.create({
      data: {
        projectId: d.projectId,
        category: d.category,
        description: d.description || null,
        amount: Number(d.amount),
        recurring: !!d.recurring,
        date: d.date ? new Date(d.date) : new Date(),
      },
    })
  );
}
