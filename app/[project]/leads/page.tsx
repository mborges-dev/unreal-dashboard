"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { LeadForm } from "@/components/LeadForm";
import { STATUS_OPTIONS, TEMP_OPTIONS, statusColor, STATUS_HEX } from "@/lib/projects";
import { Trash2 } from "lucide-react";
import { TempIcon } from "@/components/TempIcon";
import { fmtEUR, fmtDate, daysUntil } from "@/lib/utils";

export default function LeadsPage() {
  const params = useParams<{ project: string }>();
  const projectId = params.project;
  const sp = useSearchParams();
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(sp.get("q") || "");
  const [status, setStatus] = useState(sp.get("status") || "");
  const [temp, setTemp] = useState(sp.get("temp") || "");
  const [sector, setSector] = useState(sp.get("sector") || "");
  const [overdue, setOverdue] = useState(sp.get("overdue") === "1");
  const [includeSuspeitos, setIncludeSuspeitos] = useState(sp.get("suspeitos") === "1");
  const [suspeitosCount, setSuspeitosCount] = useState(0);

  async function reload() {
    const r = await fetch(`/api/leads?projectId=${projectId}${includeSuspeitos ? "&includeSuspeitos=1" : ""}`);
    setSuspeitosCount(parseInt(r.headers.get("x-suspeitos-count") || "0", 10));
    setLeads(await r.json());
  }
  useEffect(() => { reload(); }, [projectId, includeSuspeitos]);

  useEffect(() => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (temp) u.set("temp", temp);
    if (sector) u.set("sector", sector);
    if (overdue) u.set("overdue", "1");
    if (includeSuspeitos) u.set("suspeitos", "1");
    const qs = u.toString();
    router.replace(`/${projectId}/leads${qs ? `?${qs}` : ""}`);
  }, [q, status, temp, sector, overdue, includeSuspeitos, projectId, router]);

  const filtered = useMemo(() => {
    const qDigits = q.replace(/\D/g, "");
    return leads.filter((l) => {
      if (q) {
        const hay = `${l.name} ${l.company || ""} ${l.notes || ""}`.toLowerCase();
        const textMatch = hay.includes(q.toLowerCase());
        let phoneMatch = false;
        if (qDigits.length >= 3 && l.phone) {
          const phoneDigits = l.phone.replace(/\D/g, "");
          const noPrefix = phoneDigits.startsWith("351") ? phoneDigits.slice(3) : phoneDigits;
          phoneMatch = noPrefix.includes(qDigits) || phoneDigits.includes(qDigits);
        }
        if (!textMatch && !phoneMatch) return false;
      }
      if (status && l.status !== status) return false;
      if (temp && l.temperature !== temp) return false;
      if (sector && (l.sector || "").toLowerCase() !== sector.toLowerCase()) return false;
      if (overdue) {
        const now = Date.now();
        if (!l.nextDate || new Date(l.nextDate).getTime() >= now) return false;
        if (["ganho", "perdido", "dormente"].includes(l.status)) return false;
      }
      return true;
    });
  }, [leads, q, status, temp, sector, overdue]);

  async function create(data: any) {
    await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    setOpen(false);
    reload();
  }

  async function patchLead(id: string, body: any) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    reload();
  }
  async function delLead(id: string) {
    if (!confirm("Eliminar este lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={`${filtered.length} de ${leads.length}`}
        actions={
          <>
            <Link href={`/${projectId}/leads/import`} className="btn">Importar</Link>
            <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Novo lead</button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <input className="input" placeholder="Procurar (nome, empresa, telefone, notas)..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os estados</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={temp} onChange={(e) => setTemp(e.target.value)}>
            <option value="">Qualquer temperatura</option>
            <option value="quente">quente</option>
            <option value="morno">morno</option>
            <option value="frio">frio</option>
          </select>
          <input className="input" placeholder="Sector" value={sector} onChange={(e) => setSector(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {suspeitosCount > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeSuspeitos} onChange={(e) => setIncludeSuspeitos(e.target.checked)} />
              <span>
                Incluir suspeitos <span className="text-muted">({suspeitosCount.toLocaleString("pt-PT")})</span>
              </span>
            </label>
          )}
          {overdue && (
            <>
              <span className="badge bg-red-900/40 border-red-900 text-red-300">só em atraso</span>
              <button className="text-xs link" onClick={() => setOverdue(false)}>limpar</button>
            </>
          )}
        </div>
        {filtered.length === 0 && suspeitosCount > 0 && !includeSuspeitos && (
          <div className="card border-amber-900/50 bg-amber-950/20">
            <p className="text-sm">
              Não tens leads activos neste projecto, mas tens <strong>{suspeitosCount.toLocaleString("pt-PT")} suspeitos</strong> à espera de serem contactados.
            </p>
            <button className="btn mt-2" onClick={() => setIncludeSuspeitos(true)}>Mostrar suspeitos</button>
          </div>
        )}
        <div className="card p-0 overflow-x-auto">
          <table className="data">
            <thead>
              <tr>
                <th>Nome</th><th>Empresa</th><th>Telefone</th><th>Sector</th>
                <th>Estado</th><th>Temp</th><th className="text-right">Receita</th>
                <th>Próxima acção</th><th>Data</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const d = daysUntil(l.nextDate);
                const isOverdue = d != null && d < 0;
                const today = d === 0;
                return (
                  <tr key={l.id} className={`group ${isOverdue ? "bg-red-950/30" : today ? "bg-amber-950/30" : ""}`}>
                    <td>
                      <Link className="link" href={`/${projectId}/leads/${l.id}`}>{l.name}</Link>
                      {l.role && <div className="text-xs text-muted">{l.role}</div>}
                    </td>
                    <td>{l.company || "—"}</td>
                    <td className="font-mono text-xs">{l.phone || "—"}</td>
                    <td className="text-xs">{l.sector || "—"}</td>
                    <td>
                      <div className="relative inline-block">
                        <select
                          className="text-xs rounded font-medium text-white cursor-pointer pl-2 pr-6 py-1 border-0 outline-none focus:ring-2 focus:ring-white/30"
                          style={{
                            backgroundColor: STATUS_HEX[l.status] || "#3f3f46",
                            WebkitAppearance: "none",
                            MozAppearance: "none",
                            appearance: "none",
                          }}
                          value={l.status}
                          onChange={(e) => patchLead(l.id, { status: e.target.value })}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s} style={{ backgroundColor: "#1c1c21", color: "#f4f4f5" }}>{s}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-white text-[10px]">▾</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <TempIcon value={l.temperature} />
                        <select
                          className="bg-transparent text-sm"
                          value={l.temperature || ""}
                          onChange={(e) => patchLead(l.id, { temperature: e.target.value || null })}
                        >
                          <option value="">—</option>
                          {TEMP_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="text-right">{fmtEUR(l.expectedRevenue)}</td>
                    <td>
                      <input
                        className="bg-transparent w-full text-sm focus:bg-surface2 px-1 rounded"
                        defaultValue={l.nextAction || ""}
                        onBlur={(e) => e.target.value !== (l.nextAction || "") && patchLead(l.id, { nextAction: e.target.value || null })}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="bg-transparent text-xs focus:bg-surface2 px-1 rounded"
                        defaultValue={l.nextDate?.slice(0, 10) || ""}
                        onChange={(e) => patchLead(l.id, { nextDate: e.target.value || null })}
                      />
                      {d != null && (
                        <div className={`text-xs ${isOverdue ? "text-red-400" : today ? "text-amber-400" : "text-muted"}`}>
                          {d === 0 ? "hoje" : d < 0 ? `${-d}d atrasado` : `+${d}d`}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition p-1 text-muted hover:text-red-400"
                        onClick={() => delLead(l.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-muted">Sem leads. Cria um novo ou importa.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo lead">
        <LeadForm projectId={projectId} onSubmit={create} onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}
