"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ExternalLink, LayoutGrid, Table as TableIcon } from "lucide-react";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { fmtEUR, fmtDate, daysUntil } from "@/lib/utils";
import { STAGES, PLATFORMS, KANBAN_STAGES, stageLabel, stageColor, type Stage } from "@/lib/freelance";

const AMBER = "#F59E0B";

export default function FreelanceLeadsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [stage, setStage] = useState<string>(sp.get("stage") || "");
  const [platform, setPlatform] = useState<string>(sp.get("platform") || "");
  const [q, setQ] = useState<string>(sp.get("q") || "");
  const [onlyToday, setOnlyToday] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  async function reload() {
    const r = await fetch("/api/freelance/leads", { cache: "no-store" });
    setItems(await r.json());
  }
  useEffect(() => { reload(); }, []);

  useEffect(() => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (stage) u.set("stage", stage);
    if (platform) u.set("platform", platform);
    router.replace(`/freelance/leads${u.toString() ? `?${u}` : ""}`);
  }, [q, stage, platform, router]);

  const filtered = useMemo(() => items.filter((i) => {
    if (stage && i.stage !== stage) return false;
    if (platform && i.platform !== platform) return false;
    if (q && !`${i.projectTitle} ${i.clientName || ""} ${i.notes || ""} ${i.skillsMatch || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (onlyToday) {
      if (!i.nextActionDate) return false;
      const d = new Date(i.nextActionDate);
      if (d > new Date(new Date().setHours(23, 59, 59, 999))) return false;
      if (i.outcome) return false;
    }
    return true;
  }), [items, stage, platform, q, onlyToday]);

  async function patch(id: string, body: any) {
    await fetch(`/api/freelance/leads/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    reload();
  }
  async function del(id: string) {
    if (!confirm("Eliminar esta candidatura?")) return;
    await fetch(`/api/freelance/leads/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <Shell>
      <PageHeader
        title="Candidaturas Freelance"
        subtitle={`${filtered.length} de ${items.length}`}
        actions={
          <>
            <button className={`btn ${view === "table" ? "btn-primary" : ""}`} style={view === "table" ? { background: AMBER, borderColor: AMBER } : {}} onClick={() => setView("table")}><TableIcon size={14} /> Tabela</button>
            <button className={`btn ${view === "kanban" ? "btn-primary" : ""}`} style={view === "kanban" ? { background: AMBER, borderColor: AMBER } : {}} onClick={() => setView("kanban")}><LayoutGrid size={14} /> Kanban</button>
            <button className="btn btn-primary" style={{ background: AMBER, borderColor: AMBER }} onClick={() => setNewOpen(true)}><Plus size={14} /> Nova</button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-5 gap-2">
          <input className="input col-span-2" placeholder="Procurar (título, cliente, skills, notas)..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">Todos os stages</option>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">Todas plataformas</option>
            {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={onlyToday} onChange={(e) => setOnlyToday(e.target.checked)} />
            Só com acção hoje
          </label>
        </div>

        {view === "table" ? (
          <div className="card p-0 overflow-x-auto">
            <table className="data">
              <thead>
                <tr>
                  <th>Projecto</th><th>Plataforma</th><th>Cliente</th><th>Stage</th>
                  <th className="text-right">Valor</th><th>Próxima acção</th><th>Data</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const d = daysUntil(l.nextActionDate);
                  const overdue = d != null && d < 0 && !l.outcome;
                  return (
                    <tr key={l.id} className={`group ${overdue ? "bg-red-950/20" : ""}`}>
                      <td>
                        <button className="link text-left" onClick={() => setEditing(l)}>{l.projectTitle}</button>
                        {l.skillsMatch && <div className="text-xs text-muted">{l.skillsMatch}</div>}
                      </td>
                      <td><span className="badge text-xs capitalize">{l.platform}</span></td>
                      <td className="text-sm">{l.clientName || "—"}</td>
                      <td>
                        <select
                          className="text-xs rounded font-medium text-white cursor-pointer pl-2 pr-6 py-1 border-0 outline-none"
                          style={{ backgroundColor: stageColor(l.stage), WebkitAppearance: "none", MozAppearance: "none", appearance: "none" }}
                          value={l.stage}
                          onChange={(e) => patch(l.id, { stage: e.target.value })}
                        >
                          {STAGES.map((s) => <option key={s.key} value={s.key} style={{ backgroundColor: "#1c1c21", color: "#f4f4f5" }}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="text-right">{fmtEUR(l.estValueEur)}</td>
                      <td>
                        <input
                          className="bg-transparent w-full text-sm focus:bg-surface2 px-1 rounded"
                          defaultValue={l.nextAction || ""}
                          onBlur={(e) => e.target.value !== (l.nextAction || "") && patch(l.id, { nextAction: e.target.value || null })}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="bg-transparent text-xs focus:bg-surface2 px-1 rounded"
                          defaultValue={l.nextActionDate?.slice(0, 10) || ""}
                          onChange={(e) => patch(l.id, { nextActionDate: e.target.value || null })}
                        />
                        {d != null && (
                          <div className={`text-xs ${overdue ? "text-red-400" : d === 0 ? "text-amber-400" : "text-muted"}`}>
                            {d === 0 ? "hoje" : d < 0 ? `${-d}d atrasado` : `+${d}d`}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          {l.url && <a href={l.url} target="_blank" rel="noopener" className="p-1 text-muted hover:text-white" title="Abrir listing"><ExternalLink size={14} /></a>}
                          <button className="p-1 text-muted hover:text-red-400" onClick={() => del(l.id)} title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-10 text-muted">Sem candidaturas{q || stage || platform ? " (com este filtro)" : ". Clica '+ Nova' para começar"}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <KanbanBoard
            columns={KANBAN_STAGES.map((s) => ({ id: s, label: stageLabel(s) }))}
            items={filtered.filter((i) => KANBAN_STAGES.includes(i.stage)).map((i) => ({ ...i, status: i.stage }))}
            onMove={(id, status) => patch(id, { stage: status })}
            renderCard={(it: any) => (
              <button onClick={() => setEditing(it)} className="text-left w-full">
                <div className="text-sm font-medium line-clamp-2">{it.projectTitle}</div>
                <div className="text-xs text-muted mt-1 capitalize">{it.platform} {it.clientName && `· ${it.clientName}`}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold">{fmtEUR(it.estValueEur)}</span>
                  {it.nextActionDate && <span className="text-xs text-muted">{fmtDate(it.nextActionDate)}</span>}
                </div>
              </button>
            )}
          />
        )}
      </div>

      {editing && <DetailModal lead={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      <NewModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={() => { setNewOpen(false); reload(); }} />
    </Shell>
  );
}

function DetailModal({ lead, onClose, onSaved }: { lead: any; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<any>(lead);
  async function save() {
    const payload = { ...d };
    delete payload.id; delete payload.createdAt; delete payload.updatedAt;
    await fetch(`/api/freelance/leads/${lead.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    onSaved();
  }
  return (
    <Modal open={true} onClose={onClose} title={lead.projectTitle}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><div className="label mb-1">Título</div><input className="input" value={d.projectTitle || ""} onChange={(e) => setD({ ...d, projectTitle: e.target.value })} /></div>
        <div><div className="label mb-1">Plataforma</div>
          <select className="input" value={d.platform} onChange={(e) => setD({ ...d, platform: e.target.value })}>
            {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div><div className="label mb-1">Stage</div>
          <select className="input" value={d.stage} onChange={(e) => setD({ ...d, stage: e.target.value })}>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div><div className="label mb-1">Cliente</div><input className="input" value={d.clientName || ""} onChange={(e) => setD({ ...d, clientName: e.target.value })} /></div>
        <div><div className="label mb-1">Tipo tarifa</div>
          <select className="input" value={d.rateType || ""} onChange={(e) => setD({ ...d, rateType: e.target.value || null })}>
            <option value="">—</option>
            <option value="fixed">Preço fixo</option><option value="daily">Diário</option><option value="hourly">Hora</option>
          </select>
        </div>
        <div className="col-span-2"><div className="label mb-1">Link</div><input className="input" value={d.url || ""} onChange={(e) => setD({ ...d, url: e.target.value })} /></div>
        <div><div className="label mb-1">Valor estimado (€)</div><input type="number" className="input" value={d.estValueEur ?? ""} onChange={(e) => setD({ ...d, estValueEur: e.target.value ? parseFloat(e.target.value) : null })} /></div>
        <div><div className="label mb-1">Probabilidade (0-1)</div><input type="number" step="0.05" min="0" max="1" className="input" value={d.probability ?? ""} onChange={(e) => setD({ ...d, probability: e.target.value ? parseFloat(e.target.value) : null })} /></div>
        <div className="col-span-2"><div className="label mb-1">Skills match (CSV)</div><input className="input" value={d.skillsMatch || ""} onChange={(e) => setD({ ...d, skillsMatch: e.target.value })} /></div>
        <div><div className="label mb-1">Próxima acção</div><input className="input" value={d.nextAction || ""} onChange={(e) => setD({ ...d, nextAction: e.target.value })} /></div>
        <div><div className="label mb-1">Data próxima acção</div><input type="date" className="input" value={d.nextActionDate?.slice(0, 10) || ""} onChange={(e) => setD({ ...d, nextActionDate: e.target.value || null })} /></div>
        <div className="col-span-2"><div className="label mb-1">Notas</div><textarea className="input min-h-[100px]" value={d.notes || ""} onChange={(e) => setD({ ...d, notes: e.target.value })} /></div>
        <div className="col-span-2 flex justify-between gap-2">
          {d.url && <a href={d.url} target="_blank" rel="noopener" className="btn"><ExternalLink size={14} /> Abrir listing</a>}
          <div className="flex gap-2 ml-auto">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: AMBER, borderColor: AMBER }} onClick={save}>Guardar</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function NewModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ platform: "malt", projectTitle: "", clientName: "", url: "", estValueEur: "", rateType: "fixed", stage: "applied" as Stage, skillsMatch: "", nextAction: "Follow-up se silêncio em 3d", nextActionDate: "", notes: "" });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = form.nextActionDate || (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); })();
    await fetch("/api/freelance/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, nextActionDate: next, estValueEur: form.estValueEur ? parseFloat(form.estValueEur) : null }) });
    onCreated();
  }
  return (
    <Modal open={open} onClose={onClose} title="Nova candidatura">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><div className="label mb-1">Título *</div><input required className="input" value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} /></div>
        <div><div className="label mb-1">Plataforma</div>
          <select className="input" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
            {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div><div className="label mb-1">Stage</div>
          <select className="input" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })}>
            {STAGES.filter((s) => s.key !== "lost").map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div><div className="label mb-1">Cliente (opcional)</div><input className="input" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></div>
        <div><div className="label mb-1">Tarifa</div>
          <select className="input" value={form.rateType} onChange={(e) => setForm({ ...form, rateType: e.target.value })}>
            <option value="fixed">Preço fixo</option><option value="daily">Diário</option><option value="hourly">Hora</option>
          </select>
        </div>
        <div className="col-span-2"><div className="label mb-1">Link do listing</div><input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
        <div><div className="label mb-1">Valor (€)</div><input type="number" className="input" value={form.estValueEur} onChange={(e) => setForm({ ...form, estValueEur: e.target.value })} /></div>
        <div><div className="label mb-1">Skills (CSV)</div><input className="input" value={form.skillsMatch} onChange={(e) => setForm({ ...form, skillsMatch: e.target.value })} placeholder="n8n, supabase, openai" /></div>
        <div><div className="label mb-1">Próxima acção</div><input className="input" value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} /></div>
        <div><div className="label mb-1">Data (default +3d)</div><input type="date" className="input" value={form.nextActionDate} onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })} /></div>
        <div className="col-span-2"><div className="label mb-1">Notas</div><textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="col-span-2 flex justify-end gap-2"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" style={{ background: AMBER, borderColor: AMBER }}>Criar</button></div>
      </form>
    </Modal>
  );
}
