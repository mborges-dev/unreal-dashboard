import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const utc = (y: number, m: number, d: number, h = 9) => new Date(Date.UTC(y, m - 1, d, h, 0, 0));
const MON_25 = utc(2026, 5, 25);

async function main() {
  console.log("→ Hoje é Dom 24/05. Foco amanhã (Seg 25): Freelance setup como prioridade absoluta.\n");

  // 1. Mover TODAS as 4 tarefas de setup Freelance (overdue desde 21+22) para Mon 25
  const setup = await p.task.findMany({
    where: {
      projectId: "freelance",
      title: { contains: "Criar/optimizar" },
      OR: [
        { title: { contains: "Malt" } },
        { title: { contains: "Upwork" } },
      ],
    },
  });
  const pricing = await p.task.findMany({
    where: {
      projectId: "freelance",
      OR: [
        { title: { contains: "tarifa horária" } },
        { title: { contains: "propostas-template" } },
      ],
    },
  });
  const allSetup = [...setup, ...pricing];
  for (const t of allSetup) {
    await p.task.update({
      where: { id: t.id },
      data: { dueDate: MON_25, priority: "alta" },
    });
  }
  console.log(`✓ ${allSetup.length} tarefas de setup Freelance movidas para Seg 25 (alta prioridade)`);

  // 2. Mover UNREAL leads de Mon 25 para outros dias (Tue 26 - Fri 5 Jun) — libertar Mon para freelance
  const SLOTS = [
    utc(2026, 5, 26), utc(2026, 5, 27), utc(2026, 5, 28), utc(2026, 5, 29),
    utc(2026, 6, 1), utc(2026, 6, 2), utc(2026, 6, 3), utc(2026, 6, 4), utc(2026, 6, 5),
  ];
  const mondayLeads = await p.lead.findMany({
    where: {
      projectId: "unreal",
      nextDate: { gte: MON_25, lt: utc(2026, 5, 26) },
      status: { notIn: ["suspeito", "ganho", "perdido", "dormente"] },
    },
    orderBy: { id: "asc" },
  });
  for (let i = 0; i < mondayLeads.length; i++) {
    await p.lead.update({ where: { id: mondayLeads[i].id }, data: { nextDate: SLOTS[i % SLOTS.length] } });
  }
  console.log(`✓ ${mondayLeads.length} leads UNREAL de Mon 25 movidos para Ter 26+`);

  // 3. Mover ECO pitch (estava Mon 25) para Ter 26
  const ecoPitch = await p.pitch.findFirst({
    where: { date: { gte: MON_25, lt: utc(2026, 5, 26) }, outcome: "em_curso" },
  });
  if (ecoPitch) {
    await p.pitch.update({ where: { id: ecoPitch.id }, data: { date: utc(2026, 5, 26, 10) } });
    console.log("✓ ECO pitch movido para Ter 26/05");
  }

  // 4. Mover UNREAL tasks de Mon 25 para Ter 26+
  const mondayTasks = await p.task.findMany({
    where: {
      projectId: "unreal",
      status: { not: "concluida" },
      dueDate: { gte: MON_25, lt: utc(2026, 5, 26) },
    },
  });
  for (let i = 0; i < mondayTasks.length; i++) {
    await p.task.update({ where: { id: mondayTasks[i].id }, data: { dueDate: SLOTS[i % SLOTS.length] } });
  }
  console.log(`✓ ${mondayTasks.length} tarefas UNREAL movidas para Ter 26+`);

  // 5. Manter partner contacto NTT DATA na Ter 26 (já estava lá) e tarefa diária freelance Mon 25
  //    (essa tarefa não é setup pesado, apenas 5 candidaturas — fica para começar)
  const mondayApply = await p.task.findFirst({
    where: { projectId: "freelance", dueDate: MON_25, title: { contains: "Candidatar" } },
  });
  if (mondayApply) console.log("✓ Tarefa diária 'Candidatar a 5' mantida para Seg 25");

  // 6. Resumo Mon 25
  console.log("\n══ AMANHÃ SEG 25/05 ══");
  const tasks = await p.task.findMany({
    where: { dueDate: { gte: MON_25, lt: utc(2026, 5, 26) }, status: { not: "concluida" } },
    orderBy: { priority: "desc" },
  });
  for (const t of tasks) console.log(`  [${t.priority}] ${t.title}`);
  const leadsM = await p.lead.findMany({
    where: { nextDate: { gte: MON_25, lt: utc(2026, 5, 26) }, status: { notIn: ["suspeito", "ganho", "perdido", "dormente"] } },
    select: { name: true, projectId: true, nextAction: true },
  });
  console.log(`Leads activos: ${leadsM.length}`);
  for (const l of leadsM) console.log(`  ${l.projectId} | ${l.name} | ${l.nextAction || "—"}`);

  await p.$disconnect();
}

main().catch(console.error);
