"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, MessageCircle, Trophy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DAILY_LIMIT } from "@/lib/outreach";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#141417", border: "1px solid #26262d", borderRadius: 6, color: "#f4f4f5" },
  itemStyle: { color: "#f4f4f5" },
  labelStyle: { color: "#a1a1aa", fontSize: 12 },
  cursor: { fill: "#26262d", opacity: 0.4 } as any,
};

const PIPELINE_ORDER = [
  ["suspeito", "Por contactar"],
  ["m1-enviada", "M1 enviada"],
  ["m2-enviada", "M2 enviada"],
  ["m3-enviada", "M3 enviada"],
  ["m4-enviada", "M4 enviada"],
  ["respondeu", "Respondeu"],
  ["negociacao", "Em negociação"],
  ["ganho", "Cliente fechado"],
  ["perdido", "Sem interesse"],
  ["dormente", "Encerrado"],
];

export function ThefacioDashboard({ project }: { project: string }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/outreach/stats?projectId=${project}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setStats);
  }, [project]);

  if (!stats) return <div className="p-6 text-muted">A carregar...</div>;

  const pipelineData = PIPELINE_ORDER.map(([key, label]) => ({ name: label, value: stats.byStatus[key] || 0 }));
  const inFollowUp = ["m1-enviada", "m2-enviada", "m3-enviada", "m4-enviada"].reduce((s, k) => s + (stats.byStatus[k] || 0), 0);
  const remaining = Math.max(0, DAILY_LIMIT - stats.sentToday);

  return (
    <>
      <PageHeader
        title="Dashboard TheFacio"
        subtitle="Outreach WhatsApp para restaurantes"
        actions={
          <Link href={`/${project}/outreach`} className="btn btn-primary">
            <Send size={14} /> Abrir fila de envios
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-6 gap-3">
          <Kpi label="Total na base" value={stats.total.toLocaleString("pt-PT")} sub={`${stats.suspeitos.toLocaleString("pt-PT")} suspeitos`} />
          <Kpi label="Enviadas hoje" value={`${stats.sentToday}/${DAILY_LIMIT}`} tone={stats.sentToday >= DAILY_LIMIT ? "danger" : remaining < 10 ? "warn" : undefined} sub={`${remaining} restantes`} />
          <Kpi label="Em follow-up" value={inFollowUp.toString()} sub="M1-M4 a aguardar resposta" />
          <Kpi label="Respondeu" value={String(stats.responded)} sub={`Taxa global ${(stats.responseRate * 100).toFixed(1)}%`} />
          <Kpi label="Em negociação" value={String(stats.negotiating)} />
          <Kpi label="Clientes fechados" value={String(stats.closed)} tone="success" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card col-span-2">
            <h3 className="font-semibold mb-3 text-sm">Pipeline de leads</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" stroke="#71717a" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} width={130} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3 text-sm">Resumo</h3>
            <table className="data text-sm">
              <tbody>
                {PIPELINE_ORDER.map(([key, label]) => (
                  <tr key={key}>
                    <td>{label}</td>
                    <td className="text-right">{(stats.byStatus[key] || 0).toLocaleString("pt-PT")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><MessageCircle size={16} /> Como arrancar hoje</h3>
          <ol className="text-sm space-y-1 list-decimal pl-5 text-muted">
            <li>Vai a <Link className="link" href={`/${project}/outreach`}>Outreach</Link> e filtra por cidade (Lisboa/Porto).</li>
            <li>Para cada lead, clica "WhatsApp" — abre conversa com a mensagem M1 pré-preenchida.</li>
            <li>Envia, volta cá e clica "Marcar" — passa automaticamente para `m1-enviada` e agenda M2 daqui a 3 dias.</li>
            <li>Para no máximo a {DAILY_LIMIT}/dia para o número não ser banido.</li>
          </ol>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "danger" | "warn" | "success" }) {
  const colour = tone === "danger" ? "text-red-400" : tone === "warn" ? "text-amber-400" : tone === "success" ? "text-emerald-400" : "";
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${colour}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}
