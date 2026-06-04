"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import { fmtEUR, fmtDate } from "@/lib/utils";

const STATUS = ["rascunho", "enviada", "aceite", "recusada", "expirada"];

export default function Proposals() {
  const params = useParams<{ project: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [client, setClient] = useState("");
  const [d, setD] = useState({ client: "", title: "", setupValue: "", monthlyValue: "", status: "rascunho", sentAt: "", notes: "" });

  async function reload() {
    const r = await fetch(`/api/proposals?projectId=${params.project}`);
    setItems(await r.json());
  }
  useEffect(() => { reload(); }, [params.project]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/proposals", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...d, projectId: params.project,
        setupValue: d.setupValue ? parseFloat(d.setupValue) : 0,
        monthlyValue: d.monthlyValue ? parseFloat(d.monthlyValue) : 0,
      }),
    });
    setOpen(false);
    setD({ client: "", title: "", setupValue: "", monthlyValue: "", status: "rascunho", sentAt: "", notes: "" });
    reload();
  }

  const filtered = items.filter((i) =>
    (!filter || i.status === filter) && (!client || i.client.toLowerCase().includes(client.toLowerCase()))
  );

  return (
    <>
      <PageHeader title="Propostas" actions={<button className="btn btn-primary" onClick={() => setOpen(true)}>+ Nova proposta</button>} />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todos os estados</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="input" placeholder="Cliente..." value={client} onChange={(e) => setClient(e.target.value)} />
        </div>
        <div className="card p-0 overflow-x-auto">
          <table className="data">
            <thead>
              <tr><th>Cliente</th><th>Título</th><th>Estado</th><th className="text-right">Setup</th><th className="text-right">Mensal</th><th className="text-right">Total ano</th><th>Enviada</th><th>Resposta</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.client}</td><td>{p.title}</td>
                  <td><span className="badge">{p.status}</span></td>
                  <td className="text-right">{fmtEUR(p.setupValue)}</td>
                  <td className="text-right">{fmtEUR(p.monthlyValue)}</td>
                  <td className="text-right">{fmtEUR(p.totalYear)}</td>
                  <td>{fmtDate(p.sentAt)}</td>
                  <td>{fmtDate(p.respondedAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-muted">Sem propostas.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova proposta">
        <form onSubmit={create} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><div className="label mb-1">Cliente *</div><input className="input" required value={d.client} onChange={(e) => setD({ ...d, client: e.target.value })} /></div>
          <div className="col-span-2"><div className="label mb-1">Título *</div><input className="input" required value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
          <div><div className="label mb-1">Estado</div><select className="input" value={d.status} onChange={(e) => setD({ ...d, status: e.target.value })}>{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><div className="label mb-1">Enviada em</div><input type="date" className="input" value={d.sentAt} onChange={(e) => setD({ ...d, sentAt: e.target.value })} /></div>
          <div><div className="label mb-1">Setup (€)</div><input type="number" className="input" value={d.setupValue} onChange={(e) => setD({ ...d, setupValue: e.target.value })} /></div>
          <div><div className="label mb-1">Mensal (€)</div><input type="number" className="input" value={d.monthlyValue} onChange={(e) => setD({ ...d, monthlyValue: e.target.value })} /></div>
          <div className="col-span-2"><div className="label mb-1">Notas</div><textarea className="input min-h-[80px]" value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} /></div>
          <div className="col-span-2 flex justify-end gap-2"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn btn-primary">Guardar</button></div>
        </form>
      </Modal>
    </>
  );
}
