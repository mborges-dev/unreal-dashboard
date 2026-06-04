import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";
import { fmtEUR, fmtDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GlobalPage() {
  const projects = await prisma.project.findMany({ where: { id: { in: ["unreal", "thefacio"] } } });
  const leads = await prisma.lead.findMany();
  const revenues = await prisma.revenue.findMany();

  const byProject = (pid: string) => {
    const ls = leads.filter((l) => l.projectId === pid);
    const active = ls.filter((l) => !["suspeito", "ganho", "perdido", "dormente"].includes(l.status));
    const suspeitos = ls.filter((l) => l.status === "suspeito").length;
    const pipeline = active.reduce((s, l) => s + (l.expectedRevenue || 0), 0);
    const won = revenues.filter((r) => r.projectId === pid && r.status === "paga").reduce((s, r) => s + r.amount, 0);
    return { active: active.length, pipeline, won, leads: ls.length, suspeitos };
  };

  const next = leads
    .filter((l) => l.nextDate && !["ganho", "perdido"].includes(l.status))
    .sort((a, b) => +new Date(a.nextDate!) - +new Date(b.nextDate!))
    .slice(0, 10);

  return (
    <Shell>
      <PageHeader title="Visão Global" subtitle="Consolidado UNREAL + TheFacio" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => {
            const s = byProject(p.id);
            return (
              <div key={p.id} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                  <h2 className="font-semibold">{p.name}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="label">Leads activos</div><div className="text-xl font-semibold">{s.active}</div></div>
                  <div><div className="label">Suspeitos</div><div className="text-xl font-semibold text-muted">{s.suspeitos}</div></div>
                  <div><div className="label">Pipeline</div><div className="text-xl font-semibold">{fmtEUR(s.pipeline)}</div></div>
                  <div><div className="label">Receita ganha</div><div className="text-xl font-semibold">{fmtEUR(s.won)}</div></div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/${p.id}/dashboard`} className="btn">Abrir</Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">Próximas 10 acções</h3>
          <table className="data">
            <thead><tr><th>Projecto</th><th>Lead</th><th>Acção</th><th>Data</th></tr></thead>
            <tbody>
              {next.map((l) => {
                const p = projects.find((p) => p.id === l.projectId);
                return (
                  <tr key={l.id}>
                    <td><span className="badge" style={{ borderColor: p?.color, color: p?.color }}>{p?.name}</span></td>
                    <td><Link className="link" href={`/${l.projectId}/leads/${l.id}`}>{l.name}</Link></td>
                    <td>{l.nextAction || "—"}</td>
                    <td>{fmtDate(l.nextDate)}</td>
                  </tr>
                );
              })}
              {next.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-muted">Sem acções.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
