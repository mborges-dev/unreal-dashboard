import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const TODAY = new Date(Date.UTC(2026, 4, 21, 9, 0, 0));
const utc = (y: number, m: number, d: number, h = 9) => new Date(Date.UTC(y, m - 1, d, h, 0, 0));

async function main() {
  // 1. Criar projecto Freelance
  await p.project.upsert({
    where: { id: "freelance" },
    update: { name: "Freelance (Malt + Upwork)", color: "#F59E0B" },
    create: { id: "freelance", name: "Freelance (Malt + Upwork)", color: "#F59E0B" },
  });
  console.log("✓ Projecto Freelance criado");

  // 2. Mover Thu 21 + Fri 22 UNREAL leads para próxima semana
  const THU = utc(2026, 5, 21);
  const FRI = utc(2026, 5, 22);
  const NEXT_THU = utc(2026, 5, 22, 22); // até sexta 22h
  const overdue = await p.lead.findMany({
    where: {
      projectId: "unreal",
      nextDate: { gte: THU, lte: NEXT_THU },
      status: { notIn: ["suspeito", "ganho", "perdido", "dormente"] },
    },
    orderBy: { id: "asc" },
  });
  console.log(`→ ${overdue.length} leads UNREAL para redistribuir`);

  // Slots: Mon 25 - Fri 5 Jun, 2 leads extra por dia além do que já lá está
  const SLOTS = [
    utc(2026, 5, 25), utc(2026, 5, 26), utc(2026, 5, 27),
    utc(2026, 5, 28), utc(2026, 5, 29),
    utc(2026, 6, 1), utc(2026, 6, 2), utc(2026, 6, 3),
    utc(2026, 6, 4), utc(2026, 6, 5),
  ];
  for (let i = 0; i < overdue.length; i++) {
    await p.lead.update({ where: { id: overdue[i].id }, data: { nextDate: SLOTS[i % SLOTS.length] } });
  }
  console.log("✓ Leads UNREAL redistribuídos");

  // 3. Mover ECO pitch (que estava hoje 21) para Seg 25
  const ecoPitch = await p.pitch.findFirst({ where: { date: { gte: THU, lte: NEXT_THU }, outcome: "em_curso" } });
  if (ecoPitch) {
    await p.pitch.update({ where: { id: ecoPitch.id }, data: { date: utc(2026, 5, 25, 10) } });
    console.log("✓ ECO pitch movido para Seg 25/05");
  }

  // 4. Mover tasks UNREAL com dueDate Thu/Fri para próxima semana
  const tasks = await p.task.findMany({
    where: { projectId: "unreal", status: { not: "concluida" }, dueDate: { gte: THU, lte: NEXT_THU } },
  });
  for (let i = 0; i < tasks.length; i++) {
    await p.task.update({ where: { id: tasks[i].id }, data: { dueDate: SLOTS[i % 5] } });
  }
  console.log(`✓ ${tasks.length} tarefas UNREAL redistribuídas para próxima semana`);

  // 5. Criar tarefas de setup Freelancing (hoje + amanhã)
  const SETUP_TASKS = [
    { title: "[Freelance] Criar/optimizar perfil no Malt", priority: "alta", dueDate: TODAY, notes: "Skills a destacar: n8n, automação com AI, integrações de APIs, full-stack, LLMs, Supabase, Cloudflare. Mercado europeu, prioridade." },
    { title: "[Freelance] Criar/optimizar perfil no Upwork", priority: "alta", dueDate: TODAY, notes: "Skills idem ao Malt. Volume maior, mais competição. Tentar passar verificação e ter portfólio com 3 cases UNREAL anonimizados." },
    { title: "[Freelance] Definir tarifa horária + 3 packages fixos", priority: "alta", dueDate: utc(2026, 5, 22), notes: "Hora ~45-65€ Malt EU, 35-50$ Upwork. Packages: (a) Integração 2 sistemas — 800€, (b) Automação documental — 1.500€, (c) Setup IA custom — 2.500€." },
    { title: "[Freelance] Escrever 3 propostas-template (cover letters)", priority: "alta", dueDate: utc(2026, 5, 22), notes: "Uma para: (a) integrações n8n/APIs, (b) automação documental com IA, (c) Supabase + Cloudflare full-stack. Curtas, com 1 case." },
  ];
  for (const t of SETUP_TASKS) {
    await p.task.create({ data: { projectId: "freelance", status: "aberta", ...t } });
  }
  console.log(`✓ ${SETUP_TASKS.length} tarefas de setup criadas`);

  // 6. Criar tarefas diárias "5 candidaturas" Mon 25 - Fri 6 Jun
  const DAILY_DAYS = [
    utc(2026, 5, 25), utc(2026, 5, 26), utc(2026, 5, 27), utc(2026, 5, 28), utc(2026, 5, 29),
    utc(2026, 6, 1), utc(2026, 6, 2), utc(2026, 6, 3), utc(2026, 6, 4), utc(2026, 6, 5),
  ];
  for (const d of DAILY_DAYS) {
    await p.task.create({
      data: {
        projectId: "freelance",
        title: "[Freelance] Candidatar a 5 projectos (Malt + Upwork)",
        status: "aberta",
        priority: "normal",
        dueDate: d,
        notes: "Meta: 2.500€ no mês. Cada candidatura nova → criar Lead em /freelance/leads com link do projecto, valor estimado, deadline.",
      },
    });
  }
  console.log(`✓ ${DAILY_DAYS.length} tarefas diárias de candidatura criadas`);

  // 7. Snapshot final
  const counts: Record<string, number> = {};
  const all = await p.lead.findMany({
    where: { projectId: "unreal", nextDate: { not: null }, status: { notIn: ["suspeito", "ganho", "perdido", "dormente"] } },
  });
  for (const l of all) {
    const k = l.nextDate!.toISOString().slice(0, 10);
    counts[k] = (counts[k] || 0) + 1;
  }
  console.log("\nDistribuição UNREAL após move:");
  for (const k of Object.keys(counts).sort().slice(0, 15)) console.log(" ", k, ":", counts[k]);

  const freeTasks = await p.task.count({ where: { projectId: "freelance" } });
  console.log(`\nTarefas Freelance: ${freeTasks}`);

  await p.$disconnect();
}

main().catch(console.error);
