"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Radio, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { StarsRating } from "@/components/StarsRating";

const PURPLE = "#A855F7";

const STATUSES = ["identificado", "abordado", "em_negociacao", "agendado", "publicado", "sem_resposta", "recusado"];

const STATUS_COLOR: Record<string, string> = {
  identificado: "bg-zinc-700",
  abordado: "bg-blue-700",
  em_negociacao: "bg-amber-700",
  agendado: "bg-indigo-700",
  publicado: "bg-emerald-700",
  sem_resposta: "bg-zinc-800",
  recusado: "bg-red-900",
};

export default function MediaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [type, setType] = useState<"imprensa" | "podcast">("imprensa");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [minFit, setMinFit] = useState(0);
  const [audience, setAudience] = useState("");
  const [form, setForm] = useState({ type: "imprensa", name: "", editorialContact: "", host: "", url: "", audienceSize: "media", fitScore: 3, notes: "" });

  async function reload() {
    setItems(await fetch(`/api/growth/media?type=${type}`).then((r) => r.json()));
  }
  useEffect(() => { reload(); }, [type]);

  const filtered = useMemo(() => items.filter((m) => {
    if (q && !m.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (status && m.status !== status) return false;
    if (minFit > 0 && (m.fitScore || 0) < minFit) return false;
    if (audience && m.audienceSize !== audience) return false;
    return true;
  }), [items, q, status, minFit, audience]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/growth/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, type }) });
    setOpen(false);
    setForm({ type, name: "", editorialContact: "", host: "", url: "", audienceSize: "media", fitScore: 3, notes: "" });
    reload();
  }

  return (
    <>
      <PageHeader
        title={<span><Radio className="inline mr-2" size={18} style={{ color: PURPLE }} />Imprensa & Podcasts</span>}
        actions={<button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }} onClick={() => setOpen(true)}><Plus size={14} /> Adicionar</button>}
      />
      <div className="p-6 space-y-4">
        <details className="card" style={{ borderColor: PURPLE, background: "rgba(168,85,247,0.05)" }}>
          <summary className="cursor-pointer text-sm font-medium inline-flex items-center gap-1.5"><Lightbulb size={14} style={{ color: PURPLE }} /> Como usar Imprensa & Podcasts</summary>
          <div className="mt-3 text-sm text-muted space-y-1">
            <p>Cada linha é uma publicação ou podcast onde queres aparecer. Workflow típico:</p>
            <ol className="list-decimal pl-5 space-y-0.5">
              <li>Outlet começa em <strong>identificado</strong></li>
              <li>Abres o detalhe e clicas <strong>+ Novo pitch</strong> com tópico e mensagem (template "Pitch para Podcast" disponível)</li>
              <li>Outlet passa automaticamente a <strong>abordado</strong></li>
              <li>Quando aceitam → <strong>em negociação</strong> → <strong>agendado</strong> → <strong>publicado</strong></li>
              <li>Cada pitch fica no histórico do outlet</li>
            </ol>
            <p className="mt-2">Fit score (estrelas) ajuda a priorizar quem vale mais a pena pitchar primeiro.</p>
          </div>
        </details>
        <div className="flex gap-2">
          <button className={`btn ${type === "imprensa" ? "btn-primary" : ""}`} style={type === "imprensa" ? { background: PURPLE, borderColor: PURPLE } : {}} onClick={() => setType("imprensa")}>Imprensa</button>
          <button className={`btn ${type === "podcast" ? "btn-primary" : ""}`} style={type === "podcast" ? { background: PURPLE, borderColor: PURPLE } : {}} onClick={() => setType("podcast")}>Podcasts</button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <input className="input col-span-2" placeholder="Procurar..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os estados</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={minFit} onChange={(e) => setMinFit(parseInt(e.target.value))}>
            <option value={0}>Qualquer fit</option>
            {[3, 4, 5].map((n) => <option key={n} value={n}>Fit ≥ {n}</option>)}
          </select>
          <select className="input" value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="">Qualquer audiência</option>
            <option value="pequena">pequena</option><option value="media">media</option><option value="grande">grande</option>
          </select>
        </div>

        <div className="card p-0 overflow-x-auto">
          <table className="data">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contacto / Host</th>
                <th>Fit</th>
                <th>Audiência</th>
                <th>Estado</th>
                <th className="text-right">Pitches</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="cursor-pointer" onClick={() => location.href = `/growth/media/${m.id}`}>
                  <td><Link className="link" href={`/growth/media/${m.id}`}>{m.name}</Link></td>
                  <td className="text-xs">{m.host || m.editorialContact || "—"}</td>
                  <td><StarsRating value={m.fitScore} /></td>
                  <td><span className="badge text-xs">{m.audienceSize || "—"}</span></td>
                  <td><span className={`badge text-white border-transparent ${STATUS_COLOR[m.status] || ""}`}>{m.status}</span></td>
                  <td className="text-right">{m.pitches?.length || 0}</td>
                  <td className="text-xs">{m.url ? <a href={m.url} target="_blank" rel="noopener" className="link" onClick={(e) => e.stopPropagation()}>↗</a> : "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-muted">Sem resultados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`Adicionar ${type === "imprensa" ? "publicação" : "podcast"}`}>
        <form onSubmit={create} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><div className="label mb-1">Nome *</div><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          {type === "imprensa" ? (
            <div className="col-span-2"><div className="label mb-1">Contacto editorial</div><input className="input" value={form.editorialContact} onChange={(e) => setForm({ ...form, editorialContact: e.target.value })} /></div>
          ) : (
            <div className="col-span-2"><div className="label mb-1">Host</div><input className="input" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} /></div>
          )}
          <div className="col-span-2"><div className="label mb-1">URL</div><input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
          <div>
            <div className="label mb-1">Audiência</div>
            <select className="input" value={form.audienceSize} onChange={(e) => setForm({ ...form, audienceSize: e.target.value })}>
              <option value="pequena">pequena</option><option value="media">media</option><option value="grande">grande</option>
            </select>
          </div>
          <div>
            <div className="label mb-1">Fit score</div>
            <StarsRating value={form.fitScore} onChange={(n) => setForm({ ...form, fitScore: n })} />
          </div>
          <div className="col-span-2"><div className="label mb-1">Notas</div><textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }}>Criar</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
