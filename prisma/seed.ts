import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.project.upsert({
    where: { id: "unreal" },
    update: {},
    create: { id: "unreal", name: "UNREAL Performance", color: "#3B82F6" },
  });
  await prisma.project.upsert({
    where: { id: "thefacio" },
    update: {},
    create: { id: "thefacio", name: "TheFacio", color: "#10B981" },
  });
}

main().finally(() => prisma.$disconnect());
