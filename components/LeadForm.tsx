"use client";
import { useState } from "react";
import { STATUS_OPTIONS, TEMP_OPTIONS } from "@/lib/projects";

export function LeadForm({
  projectId,
  initial,
  onSubmit,
  onCancel,
}: {
  projectId: string;
  initial?: any;
  onSubmit: (data: any) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [d, setD] = useState({
    name: "",
    company: "",
    role: "",
    sector: "",
    size: "",
    status: "novo",
    temperature: "morno",
    email: "",
    phone: "",
    linkedinUrl: "",
    location: "",
    setupValue: "",
    monthlyValue: "",
    probability: "0.3",
    nextAction: "",
    nextDate: "",
    tags: "",
    notes: "",
    ...(initial || {}),
  });
  function set<K extends string>(k: K, v: any) { setD((p: any) => ({ ...p, [k]: v })); }

  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...d,
          projectId,
          setupValue: d.setupValue ? parseFloat(d.setupValue) : null,
          monthlyValue: d.monthlyValue ? parseFloat(d.monthlyValue) : null,
          probability: d.probability ? parseFloat(d.probability) : 0.3,
          nextDate: d.nextDate || null,
        });
      }}
    >
      <div className="col-span-2"><div className="label mb-1">Nome *</div><input className="input" required value={d.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div><div className="label mb-1">Empresa</div><input className="input" value={d.company} onChange={(e) => set("company", e.target.value)} /></div>
      <div><div className="label mb-1">Cargo</div><input className="input" value={d.role} onChange={(e) => set("role", e.target.value)} /></div>
      <div><div className="label mb-1">Sector</div><input className="input" value={d.sector} onChange={(e) => set("sector", e.target.value)} /></div>
      <div><div className="label mb-1">Tamanho</div><input className="input" value={d.size} onChange={(e) => set("size", e.target.value)} placeholder="ex: 10-50" /></div>
      <div>
        <div className="label mb-1">Estado</div>
        <select className="input" value={d.status} onChange={(e) => set("status", e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <div className="label mb-1">Temperatura</div>
        <select className="input" value={d.temperature} onChange={(e) => set("temperature", e.target.value)}>
          {TEMP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div><div className="label mb-1">Email</div><input className="input" value={d.email} onChange={(e) => set("email", e.target.value)} /></div>
      <div><div className="label mb-1">Telefone</div><input className="input" value={d.phone} onChange={(e) => set("phone", e.target.value)} /></div>
      <div className="col-span-2"><div className="label mb-1">LinkedIn URL</div><input className="input" value={d.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} /></div>
      <div><div className="label mb-1">Localização</div><input className="input" value={d.location} onChange={(e) => set("location", e.target.value)} /></div>
      <div><div className="label mb-1">Setup (€)</div><input className="input" type="number" step="any" value={d.setupValue} onChange={(e) => set("setupValue", e.target.value)} /></div>
      <div><div className="label mb-1">Mensal (€)</div><input className="input" type="number" step="any" value={d.monthlyValue} onChange={(e) => set("monthlyValue", e.target.value)} /></div>
      <div><div className="label mb-1">Probabilidade (0-1)</div><input className="input" type="number" min="0" max="1" step="0.05" value={d.probability} onChange={(e) => set("probability", e.target.value)} /></div>
      <div><div className="label mb-1">Próxima acção</div><input className="input" value={d.nextAction} onChange={(e) => set("nextAction", e.target.value)} /></div>
      <div><div className="label mb-1">Data próxima</div><input className="input" type="date" value={d.nextDate?.slice?.(0, 10) || d.nextDate} onChange={(e) => set("nextDate", e.target.value)} /></div>
      <div className="col-span-2"><div className="label mb-1">Tags (separadas por vírgula)</div><input className="input" value={d.tags} onChange={(e) => set("tags", e.target.value)} /></div>
      <div className="col-span-2"><div className="label mb-1">Notas</div><textarea className="input min-h-[80px]" value={d.notes} onChange={(e) => set("notes", e.target.value)} /></div>
      <div className="col-span-2 flex justify-end gap-2 mt-2">
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="btn btn-primary">Guardar</button>
      </div>
    </form>
  );
}
