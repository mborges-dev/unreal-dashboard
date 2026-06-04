"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Target, Briefcase, Check, ArrowRight, Clock, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { fmtEUR, fmtDate, daysUntil } from "@/lib/utils";
import { STAGES, PLATFORMS, RATE_TYPES, MONTHLY_GOAL_EUR, stageLabel, stageColor, type Stage } from "@/lib/freelance";

const AMBER = "#F59E0B";

export function FreelanceDashboard({ project }: { project: string }) {
  const [data, setData] = useState<any>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/freelance/stats", { cache: "no-store" });
    setData(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function completeTask(id: string) {
    await fetch("/api/tasks", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: "concluida" }) });
    load();
  }

  async function quickPatch(id: string, body: any) {
    await fetch(`/api/freelance/leads/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    load();
  }

  if (!data) return <div className="p-6 text-muted">A carregar...</div>;

  // Conversion rates between stages
  const conv = (from: Stage, to: Stage) => {
    const f = data.funnel[from] || 0;
    const t = data.funnel[to] || 0;
    // accumulate: t already includes everything after `to`
    return f > 0 ? Math.round((t / (f + t)) * 100) : 0;
  };

  return (
    <>
      <PageHeader
        title={<span><Briefcase className="inline mr-2" size={20} style={{ color: AMBER }} />Freelance</span>}
        subtitle="Malt + Upwork · meta 2.500€/mês"
        actions={
          <>
            <Link href={`/${project}/leads`} className="btn">Ver todas</Link>
            <button className="btn btn-primary" style={{ background: AMBER, borderColor: AMBER }} onClick={() => setNewOpen(true)}>
              <Plus size={14} /> Nova candidatura
            </button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        {/* Goal */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="label flex items-center gap-1.5"><Target size={12} style={{ color: AMBER }} /> Meta deste mês</div>
              <div className="text-3xl font-semibold mt-1">
                {fmtEUR(data.earnedThisMonth)} <span className="text-muted text-base">/ {fmtEUR(data.goal)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="label">Em falta</div>
              <div className="text-3xl font-semibold mt-1" style={{ color: data.progressPct >= 100 ? "#10B981" : AMBER }}>
                {fmtEUR(Math.max(0, data.goal - data.earnedThisMonth))}
              </div>
            </div>
          </div>
          <div className="h-3 bg-surface2 rounded overflow-hidden mt-3">
            <div className="h-full transition-all" style={{ width: `${data.progressPct}%`, background: data.progressPct >= 100 ? "#10B981" : AMBER }} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted mt-2">
            <span>{data.progressPct}% da meta · {data.appliedThisMonth} candidaturas este mês</span>
            <span>Pipeline ponderado: <strong style={{ color: AMBER }}>{fmtEUR(data.pipelineWeighted)}</strong> · Bruto: {fmtEUR(data.pipelineGross)}</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-6 gap-3">
          <Kpi label="Pipeline activo" value={String(data.active)} sub="candidaturas em jogo" />
          <Kpi label="Pipeline ponderado" value={fmtEUR(data.pipelineWeighted)} sub="replied + call + proposal" />
          <Kpi label="Taxa resposta" value={`${Math.round(data.responseRate * 100)}%`} sub={`${data.replied}/${data.applied}`} />
          <Kpi label="Taxa fecho" value={`${Math.round(data.winRate * 100)}%`} sub={`${data.won}/${data.replied}`} tone={data.winRate > 0 ? "success" : undefined} />
          <Kpi label="Ganhos este mês" value={String(data.won)} tone="success" />
          <Kpi label="Tarefas hoje" value={String(data.todayTasks.length)} tone={data.todayTasks.length > 0 ? "warn" : undefined} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* HOJE */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><Clock size={14} style={{ color: AMBER }} /> Hoje — acções a tomar</h3>
              <span className="text-xs text-muted">{data.today.length} candidaturas + {data.todayTasks.length} tarefas</span>
            </div>
            <ul className="space-y-2">
              {/* Tarefas Freelance */}
              {data.todayTasks.map((t: any) => (
                <li key={t.id} className="flex items-center gap-2 p-2 rounded bg-surface2 border border-border">
                  <button className="p-1 rounded hover:bg-emerald-900/30 text-muted hover:text-emerald-400" title="Marcar concluída" onClick={() => completeTask(t.id)}>
                    <Check size={14} />
                  </button>
                  <span className="flex-1 text-sm truncate">{t.title.replace(/^\[Freelance\]\s*/, "")}</span>
                  {t.priority === "alta" && <span className="badge text-xs" style={{ borderColor: AMBER, color: AMBER }}>alta</span>}
                </li>
              ))}
              {/* Candidaturas com next_action_date hoje */}
              {data.today.map((l: any) => {
                const d = daysUntil(l.nextActionDate);
                const overdue = d != null && d < 0;
                return (
                  <li key={l.id} className={`group flex items-start gap-2 p-2 rounded border ${overdue ? "border-red-900/40 bg-red-950/10" : "border-border bg-surface2"}`}>
                    <span className="w-2 h-2 mt-1.5 rounded-full shrink-0" style={{ background: stageColor(l.stage) }} />
                    <div className="flex-1 min-w-0">
                      <Link href={`/${project}/leads/${l.id}`} className="link text-sm block truncate">{l.projectTitle}</Link>
                      <div className="text-xs text-muted">
                        <span className="capitalize">{l.platform}</span> · {stageLabel(l.stage)} · {l.nextAction || "—"}
                        {d != null && <span className={overdue ? "text-red-400 ml-1" : "ml-1"}>{overdue ? `(${-d}d atrasado)` : d === 0 ? "(hoje)" : `(+${d}d)`}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-muted shrink-0">{fmtEUR(l.estValueEur)}</span>
                  </li>
                );
              })}
              {data.today.length === 0 && data.todayTasks.length === 0 && (
                <li className="text-sm text-muted italic">Nada para hoje. Aplica a alguns projectos novos.</li>
              )}
            </ul>
          </div>

          {/* FUNIL */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Funil</h3>
              <span className="text-xs text-muted">onde estão a morrer as oportunidades</span>
            </div>
            <div className="space-y-1.5">
              {STAGES.filter((s) => s.key !== "lost").map((s, idx, arr) => {
                const count = data.funnel[s.key] || 0;
                const max = Math.max(...arr.map((x) => data.funnel[x.key] || 0), 1);
                const widthPct = (count / max) * 100;
                const nextStage = arr[idx + 1];
                const nextCount = nextStage ? data.funnel[nextStage.key] || 0 : 0;
                // Conversion only valid moving forward
                const showConv = nextStage && count > 0 && idx < arr.length - 1;
                const convPct = showConv ? Math.round((nextCount / count) * 100) : null;
                return (
                  <div key={s.key}>
                    <Link href={`/${project}/leads?stage=${s.key}`} className="flex items-center gap-2 hover:bg-surface2 p-1.5 rounded transition">
                      <span className="text-xs w-32 shrink-0 truncate">{s.label}</span>
                      <div className="flex-1 h-6 bg-surface2 rounded overflow-hidden relative">
                        <div className="h-full transition-all" style={{ width: `${Math.max(2, widthPct)}%`, background: s.color }} />
                        <span className="absolute inset-0 flex items-center px-2 text-xs font-medium">{count}</span>
                      </div>
                    </Link>
                    {showConv && (
                      <div className="ml-32 my-0.5 text-xs text-muted flex items-center gap-1">
                        <ArrowRight size={10} />
                        {convPct}% convertem para {nextStage.label.toLowerCase()}
                        {convPct !== null && convPct < 30 && idx > 0 && <span className="ml-1 text-amber-400">⚠ baixa conversão</span>}
                      </div>
                    )}
                  </div>
                );
              })}
              {data.funnel.lost > 0 && (
                <div className="pt-2 mt-2 border-t border-border text-xs text-muted">
                  + {data.funnel.lost} perdidos · {data.funnel.won || 0} ganhos
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ borderColor: AMBER, background: "rgba(245,158,11,0.05)" }}>
          <details>
            <summary className="cursor-pointer text-sm font-medium flex items-center gap-2"><Briefcase size={14} style={{ color: AMBER }} /> Como funciona o fluxo</summary>
            <ol className="mt-3 text-sm space-y-1 list-decimal pl-5 text-muted">
              <li><strong>Identificada</strong>: encontraste no Malt/Upwork, ainda não te candidataste</li>
              <li><strong>Candidatura enviada</strong>: aplicaste; <code>appliedAt</code> é registado automaticamente</li>
              <li><strong>Cliente respondeu</strong>: começa a contar para pipeline ponderado (×20%)</li>
              <li><strong>Call marcada</strong>: agenda uma data no <code>nextActionDate</code> (×40%)</li>
              <li><strong>Orçamento enviado</strong>: proposta formal (×60%)</li>
              <li><strong>Ganho</strong> (×100%) ou <strong>Perdido</strong> (esquece e segue)</li>
            </ol>
            <p className="mt-2 text-xs text-muted">
              Pipeline ponderado = soma de est_value × probabilidade de fecho para leads em <strong>replied + call_scheduled + proposal_sent</strong>. Se for &lt;2.500€, precisas de candidatar a mais projectos.
            </p>
          </details>
        </div>
      </div>

      <NewApplicationModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={() => { setNewOpen(false); load(); }} />
    </>
  );
}

function NewApplicationModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    platform: "malt" as "malt" | "upwork" | "direct",
    projectTitle: "",
    clientName: "",
    url: "",
    estValueEur: "",
    rateType: "fixed" as "fixed" | "daily" | "hourly",
    stage: "applied" as Stage,
    skillsMatch: "",
    nextAction: "",
    nextActionDate: "",
    notes: "",
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/freelance/leads", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, estValueEur: form.estValueEur ? parseFloat(form.estValueEur) : null }),
    });
    onCreated();
    setForm({ platform: "malt", projectTitle: "", clientName: "", url: "", estValueEur: "", rateType: "fixed", stage: "applied", skillsMatch: "", nextAction: "", nextActionDate: "", notes: "" });
  }
  return (
    <Modal open={open} onClose={onClose} title="Nova candidatura">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><div className="label mb-1">Título do projecto *</div>
          <input required className="input" value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} placeholder="ex: Integração n8n + Notion para SaaS Berlim" />
        </div>
        <div><div className="label mb-1">Plataforma</div>
          <select className="input" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as any })}>
            {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div><div className="label mb-1">Stage</div>
          <select className="input" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })}>
            {STAGES.filter((s) => s.key !== "lost").map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div><div className="label mb-1">Cliente (opcional)</div>
          <input className="input" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="anónimo no Upwork normalmente" />
        </div>
        <div><div className="label mb-1">Tipo de tarifa</div>
          <select className="input" value={form.rateType} onChange={(e) => setForm({ ...form, rateType: e.target.value as any })}>
            {RATE_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
        <div className="col-span-2"><div className="label mb-1">Link do listing</div>
          <input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://www.malt.pt/project/..." />
        </div>
        <div><div className="label mb-1">Valor estimado (€)</div>
          <input type="number" className="input" value={form.estValueEur} onChange={(e) => setForm({ ...form, estValueEur: e.target.value })} />
        </div>
        <div><div className="label mb-1">Skills match (CSV)</div>
          <input className="input" value={form.skillsMatch} onChange={(e) => setForm({ ...form, skillsMatch: e.target.value })} placeholder="n8n, supabase, openai" />
        </div>
        <div><div className="label mb-1">Próxima acção</div>
          <input className="input" value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} placeholder="Follow-up se silêncio em 3d" />
        </div>
        <div><div className="label mb-1">Data próxima acção</div>
          <input type="date" className="input" value={form.nextActionDate} onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })} />
        </div>
        <div className="col-span-2"><div className="label mb-1">Notas</div>
          <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contexto, deadline, requisitos especiais..." />
        </div>
        <div className="col-span-2 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" style={{ background: AMBER, borderColor: AMBER }}>Criar</button>
        </div>
      </form>
    </Modal>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "success" | "warn" }) {
  const colour = tone === "warn" ? "text-amber-400" : tone === "success" ? "text-emerald-400" : "";
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${colour}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}
