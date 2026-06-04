"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Check, Trophy, X, Plus, Calendar as CalendarIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { LeadForm } from "@/components/LeadForm";
import { DashboardCharts } from "./Charts";
import { ThefacioDashboard } from "./Thefacio";
import { FreelanceDashboard } from "./Freelance";
import { fmtEUR, fmtDate, daysUntil } from "@/lib/utils";

export default function Dashboard() {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/thefacio/")) return <ThefacioDashboard project="thefacio" />;
  if (pathname.startsWith("/freelance/")) return <FreelanceDashboard project="freelance" />;
  return <UnrealDashboard project="unreal" />;
}

function UnrealDashboard({ project }: { project: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/dashboard?projectId=${project}`, { cache: "no-store" });
    setData(await r.json());
  }, [project]);

  useEffect(() => { load(); }, [load]);

  const patchLead = async (id: string, body: any) => {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    load();
  };
  const completeTask = async (id: string) => {
    await fetch("/api/tasks", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: "concluida" }) });
    load();
  };
  const createLead = async (d: any) => {
    await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
    setNewOpen(false);
    load();
  };
  const bumpNextDate = async (id: string, days: number) => {
    const dt = new Date(); dt.setDate(dt.getDate() + days);
    await patchLead(id, { nextDate: dt.toISOString() });
  };

  if (!data) return <div className="p-6 text-muted">A carregar...</div>;
  const { kpis, topLeads, nextActions, tasks, byStatus, sectorData, months } = data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${kpis.active} leads activos · pipeline ${fmtEUR(kpis.pipeline)}`}
        actions={
          <>
            <button className="btn" onClick={() => router.push(`/${project}/calendar`)}>
              <CalendarIcon size={14} /> Calendário
            </button>
            <button className="btn btn-primary" onClick={() => setNewOpen(true)}>
              <Plus size={14} /> Novo lead
            </button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-6 gap-3">
          <KpiLink href={`/${project}/leads`} label="Leads activos" value={String(kpis.active)} />
          <KpiLink href={`/${project}/leads`} label="Pipeline ponderado" value={fmtEUR(kpis.pipeline)} />
          <KpiLink href={`/${project}/finance`} label="Receita ganha" value={fmtEUR(kpis.won)} />
          <KpiLink href={`/${project}/leads?overdue=1`} label="Em atraso" value={String(kpis.overdue)} tone={kpis.overdue ? "danger" : undefined} />
          <KpiLink href={`/${project}/leads?status=reuniao-marcada`} label="Reuniões" value={String(kpis.meetings)} />
          <KpiLink href={`/${project}/finance`} label="Runway" value={kpis.runway == null ? "—" : `${kpis.runway.toFixed(1)}m`} />
        </div>

        <DashboardCharts byStatus={byStatus} sectorData={sectorData} months={months} />

        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <h3 className="font-semibold mb-3">Top 5 leads</h3>
            <ul className="text-sm space-y-2">
              {topLeads.map((l: any) => (
                <li key={l.id} className="group flex justify-between items-center gap-2">
                  <Link className="link truncate flex-1" href={`/${project}/leads/${l.id}`}>{l.name}</Link>
                  <span className="text-muted shrink-0">{fmtEUR(l.expectedRevenue)}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                    <button
                      title="Marcar ganho"
                      className="p-1 rounded hover:bg-emerald-900/30 text-emerald-400"
                      onClick={() => patchLead(l.id, { status: "ganho" })}
                    >
                      <Trophy size={14} />
                    </button>
                    <button
                      title="Marcar perdido"
                      className="p-1 rounded hover:bg-red-900/30 text-red-400"
                      onClick={() => patchLead(l.id, { status: "perdido" })}
                    >
                      <X size={14} />
                    </button>
                  </span>
                </li>
              ))}
              {topLeads.length === 0 && <li className="text-muted">Sem leads.</li>}
            </ul>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Próximas acções</h3>
            <ul className="text-sm space-y-2">
              {nextActions.map((l: any) => {
                const d = daysUntil(l.nextDate);
                const tone = d != null && d < 0 ? "text-red-400" : d === 0 ? "text-amber-400" : "text-muted";
                return (
                  <li key={l.id} className="group flex items-center gap-2">
                    <Link className="link truncate flex-1" href={`/${project}/leads/${l.id}`}>{l.name}</Link>
                    <span className={`shrink-0 text-xs ${tone}`}>{fmtDate(l.nextDate)}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                      <button
                        title="Adiar 3 dias"
                        className="p-1 rounded hover:bg-surface2 text-muted"
                        onClick={() => bumpNextDate(l.id, 3)}
                      >+3d</button>
                      <button
                        title="Adiar 1 semana"
                        className="p-1 rounded hover:bg-surface2 text-muted"
                        onClick={() => bumpNextDate(l.id, 7)}
                      >+7d</button>
                      <button
                        title="Marcar feito (limpar)"
                        className="p-1 rounded hover:bg-emerald-900/30 text-emerald-400"
                        onClick={() => patchLead(l.id, { nextDate: null, nextAction: null })}
                      ><Check size={14} /></button>
                    </span>
                  </li>
                );
              })}
              {nextActions.length === 0 && <li className="text-muted">Sem acções.</li>}
            </ul>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Tarefas urgentes</h3>
            <ul className="text-sm space-y-2">
              {tasks.map((t: any) => (
                <li key={t.id} className="group flex items-center gap-2">
                  <button
                    className="p-1 rounded hover:bg-emerald-900/30 text-muted hover:text-emerald-400"
                    title="Marcar concluída"
                    onClick={() => completeTask(t.id)}
                  ><Check size={14} /></button>
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="text-muted text-xs shrink-0">{fmtDate(t.dueDate)}</span>
                </li>
              ))}
              {tasks.length === 0 && <li className="text-muted">Sem tarefas.</li>}
            </ul>
          </div>
        </div>
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Novo lead">
        <LeadForm projectId={project} onSubmit={createLead} onCancel={() => setNewOpen(false)} />
      </Modal>
    </>
  );
}

function KpiLink({ href, label, value, tone }: { href: string; label: string; value: string; tone?: "danger" }) {
  return (
    <Link href={href} className="card hover:border-zinc-600 transition">
      <div className="label">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone === "danger" ? "text-red-400" : ""}`}>{value}</div>
    </Link>
  );
}
