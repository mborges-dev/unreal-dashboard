"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { fmtEUR, fmtDate } from "@/lib/utils";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const PIE = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

export default function Finance() {
  const params = useParams<{ project: string }>();
  const [tab, setTab] = useState<"overview" | "revenues" | "expenses">("overview");
  const [data, setData] = useState<{ revenues: any[]; expenses: any[] }>({ revenues: [], expenses: [] });
  const [showRev, setShowRev] = useState(false);
  const [showExp, setShowExp] = useState(false);
  const [rev, setRev] = useState({ client: "", amount: "", status: "pendente", issuedAt: "" });
  const [exp, setExp] = useState({ category: "", description: "", amount: "", recurring: false, date: "" });

  async function reload() {
    const r = await fetch(`/api/finance?projectId=${params.project}`);
    setData(await r.json());
  }
  useEffect(() => { reload(); }, [params.project]);

  async function addRev(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/finance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "revenue", projectId: params.project, ...rev }) });
    setShowRev(false); setRev({ client: "", amount: "", status: "pendente", issuedAt: "" }); reload();
  }
  async function addExp(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/finance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "expense", projectId: params.project, ...exp }) });
    setShowExp(false); setExp({ category: "", description: "", amount: "", recurring: false, date: "" }); reload();
  }

  const months = useMemo(() => {
    const now = new Date();
    const out: { name: string; receita: number; despesa: number; net: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.toISOString().slice(0, 7);
      const receita = data.revenues.filter((r) => r.issuedAt.slice(0, 7) === k).reduce((s, r) => s + r.amount, 0);
      const despesa = data.expenses.filter((e) => e.date.slice(0, 7) === k).reduce((s, e) => s + e.amount, 0);
      out.push({ name: d.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" }), receita, despesa, net: receita - despesa });
    }
    return out;
  }, [data]);

  const expByCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of data.expenses) m[e.category] = (m[e.category] || 0) + e.amount;
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [data]);

  const monthlyExpAvg = data.expenses.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0);
  const balance = data.revenues.filter((r) => r.status === "paga").reduce((s, r) => s + r.amount, 0) - data.expenses.reduce((s, e) => s + e.amount, 0);
  const runway = monthlyExpAvg > 0 ? balance / monthlyExpAvg : null;

  return (
    <>
      <PageHeader title="Finanças" subtitle={`Saldo: ${fmtEUR(balance)} · Runway: ${runway == null ? "—" : runway.toFixed(1) + " meses"}`} />
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <button className={`btn ${tab === "overview" ? "btn-primary" : ""}`} onClick={() => setTab("overview")}>Visão geral</button>
          <button className={`btn ${tab === "revenues" ? "btn-primary" : ""}`} onClick={() => setTab("revenues")}>Receitas</button>
          <button className={`btn ${tab === "expenses" ? "btn-primary" : ""}`} onClick={() => setTab("expenses")}>Despesas</button>
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-3 text-sm">Cash flow (últimos 12 meses)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={months}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#141417", border: "1px solid #26262d" }} />
                  <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-3 text-sm">Receita vs Despesas</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={months}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#141417", border: "1px solid #26262d" }} />
                  <Legend />
                  <Bar dataKey="receita" fill="#10B981" />
                  <Bar dataKey="despesa" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card col-span-2">
              <h3 className="font-semibold mb-3 text-sm">Despesas por categoria</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={expByCat} dataKey="value" nameKey="name" outerRadius={90} label>
                    {expByCat.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#141417", border: "1px solid #26262d" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "revenues" && (
          <div className="card">
            <div className="flex justify-between mb-3"><h3 className="font-semibold">Receitas</h3><button className="btn btn-primary" onClick={() => setShowRev(true)}>+ Nova receita</button></div>
            <table className="data">
              <thead><tr><th>Cliente</th><th className="text-right">Valor</th><th>Estado</th><th>Emitida</th><th>Paga</th></tr></thead>
              <tbody>
                {data.revenues.map((r) => (
                  <tr key={r.id}><td>{r.client}</td><td className="text-right">{fmtEUR(r.amount)}</td><td><span className="badge">{r.status}</span></td><td>{fmtDate(r.issuedAt)}</td><td>{fmtDate(r.paidAt)}</td></tr>
                ))}
                {data.revenues.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-muted">Sem receitas.</td></tr>}
              </tbody>
            </table>
            {showRev && (
              <form onSubmit={addRev} className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-4">
                <input className="input" placeholder="Cliente" required value={rev.client} onChange={(e) => setRev({ ...rev, client: e.target.value })} />
                <input className="input" type="number" placeholder="Valor" required value={rev.amount} onChange={(e) => setRev({ ...rev, amount: e.target.value })} />
                <select className="input" value={rev.status} onChange={(e) => setRev({ ...rev, status: e.target.value })}>
                  <option value="pendente">pendente</option><option value="paga">paga</option><option value="atrasada">atrasada</option>
                </select>
                <input className="input" type="date" value={rev.issuedAt} onChange={(e) => setRev({ ...rev, issuedAt: e.target.value })} />
                <div className="col-span-4 flex justify-end gap-2"><button type="button" className="btn" onClick={() => setShowRev(false)}>Cancelar</button><button className="btn btn-primary">Guardar</button></div>
              </form>
            )}
          </div>
        )}

        {tab === "expenses" && (
          <div className="card">
            <div className="flex justify-between mb-3"><h3 className="font-semibold">Despesas</h3><button className="btn btn-primary" onClick={() => setShowExp(true)}>+ Nova despesa</button></div>
            <table className="data">
              <thead><tr><th>Categoria</th><th>Descrição</th><th className="text-right">Valor</th><th>Recorrente</th><th>Data</th></tr></thead>
              <tbody>
                {data.expenses.map((e) => (
                  <tr key={e.id}><td>{e.category}</td><td>{e.description || "—"}</td><td className="text-right">{fmtEUR(e.amount)}</td><td>{e.recurring ? "Sim" : "Não"}</td><td>{fmtDate(e.date)}</td></tr>
                ))}
                {data.expenses.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-muted">Sem despesas.</td></tr>}
              </tbody>
            </table>
            {showExp && (
              <form onSubmit={addExp} className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-4">
                <input className="input" placeholder="Categoria" required value={exp.category} onChange={(ev) => setExp({ ...exp, category: ev.target.value })} />
                <input className="input" placeholder="Descrição" value={exp.description} onChange={(ev) => setExp({ ...exp, description: ev.target.value })} />
                <input className="input" type="number" placeholder="Valor" required value={exp.amount} onChange={(ev) => setExp({ ...exp, amount: ev.target.value })} />
                <input className="input" type="date" value={exp.date} onChange={(ev) => setExp({ ...exp, date: ev.target.value })} />
                <label className="flex items-center gap-2 text-sm col-span-4"><input type="checkbox" checked={exp.recurring} onChange={(ev) => setExp({ ...exp, recurring: ev.target.checked })} /> Recorrente</label>
                <div className="col-span-4 flex justify-end gap-2"><button type="button" className="btn" onClick={() => setShowExp(false)}>Cancelar</button><button className="btn btn-primary">Guardar</button></div>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
