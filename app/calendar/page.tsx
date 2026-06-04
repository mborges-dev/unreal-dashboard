"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, FileText, Send, Users2, ListChecks, Users, Briefcase, Target } from "lucide-react";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";
import { PROJECTS } from "@/lib/projects";

type Ev = {
  id: string;
  date: Date;
  title: string;
  category: "lead" | "task" | "meeting" | "proposal" | "content" | "pitch" | "partner";
  project: "unreal" | "thefacio" | "freelance" | "growth";
  href?: string;
};

const CATEGORY_LABEL: Record<Ev["category"], string> = {
  lead: "Lead",
  task: "Tarefa",
  meeting: "Reunião",
  proposal: "Proposta",
  content: "Post",
  pitch: "Pitch",
  partner: "Parceiro",
};

export default function CollectiveCalendar() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [events, setEvents] = useState<Ev[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    unreal: true, thefacio: true, freelance: false, growth: true,
    lead: true, task: true, meeting: true, proposal: true, content: true, pitch: true, partner: true,
  });

  useEffect(() => {
    (async () => {
      const safe = async (u: string) => { try { const r = await fetch(u); if (!r.ok) return []; const j = await r.json(); return Array.isArray(j) ? j : []; } catch { return []; } };
      const projects = ["unreal", "thefacio"] as const;
      const allLeads: Record<string, any[]> = {};
      const allTasks: Record<string, any[]> = { unreal: [], thefacio: [], freelance: [] };
      const allProps: Record<string, any[]> = { unreal: [], thefacio: [], freelance: [] };
      for (const pj of projects) {
        allLeads[pj] = await safe(`/api/leads?projectId=${pj}`);
        allTasks[pj] = await safe(`/api/tasks?projectId=${pj}`);
        allProps[pj] = await safe(`/api/proposals?projectId=${pj}`);
      }
      // Freelance usa tabela própria
      allTasks.freelance = await safe(`/api/tasks?projectId=freelance`);
      const freelanceLeads = await safe(`/api/freelance/leads`);
      const content = await safe("/api/growth/content");
      const mediaList = await safe("/api/growth/media");
      const partners = await safe("/api/growth/partners");

      const evs: Ev[] = [];
      for (const pj of projects) {
        for (const l of allLeads[pj]) {
          if (l.nextDate) evs.push({
            id: `l-${l.id}`,
            date: new Date(l.nextDate),
            title: `${l.name}${l.nextAction ? ` — ${l.nextAction}` : ""}`,
            category: l.status === "reuniao-marcada" ? "meeting" : "lead",
            project: pj,
            href: `/${pj}/leads/${l.id}`,
          });
        }
        for (const p of allProps[pj]) {
          if (p.sentAt) evs.push({
            id: `p-${p.id}`,
            date: new Date(p.sentAt),
            title: `Proposta: ${p.client}`,
            category: "proposal",
            project: pj,
            href: `/${pj}/proposals`,
          });
        }
      }
      // Tasks de todos os 3 projectos (inclui Freelance)
      for (const pj of ["unreal", "thefacio", "freelance"] as const) {
        for (const t of allTasks[pj]) {
          if (t.dueDate) evs.push({
            id: `t-${t.id}`,
            date: new Date(t.dueDate),
            title: t.title.replace(/^\[(Plano|Freelance)\]\s*/, ""),
            category: "task",
            project: pj,
            href: `/${pj}/tasks`,
          });
        }
      }
      // Freelance leads (tabela própria)
      for (const l of freelanceLeads) {
        if (l.nextActionDate) evs.push({
          id: `fl-${l.id}`,
          date: new Date(l.nextActionDate),
          title: `${l.projectTitle}${l.nextAction ? ` — ${l.nextAction}` : ""}`,
          category: "lead",
          project: "freelance",
          href: `/freelance/leads`,
        });
      }
      for (const c of content) {
        if (c.scheduledFor) evs.push({ id: `c-${c.id}`, date: new Date(c.scheduledFor), title: c.title, category: "content", project: "growth", href: `/growth/content` });
        if (c.publishedAt) evs.push({ id: `cp-${c.id}`, date: new Date(c.publishedAt), title: `${c.title} (publicado)`, category: "content", project: "growth", href: `/growth/content` });
      }
      for (const m of mediaList) {
        for (const pt of (m.pitches || [])) evs.push({
          id: `pt-${pt.id}`,
          date: new Date(pt.date),
          title: `${m.name}: ${pt.topic}`,
          category: "pitch",
          project: "growth",
          href: `/growth/media/${m.id}`,
        });
      }
      for (const pr of partners) {
        for (const it of (pr.interactions || [])) {
          if (it.nextStepDate) evs.push({
            id: `pn-${it.id}`,
            date: new Date(it.nextStepDate),
            title: `${pr.name}: ${it.nextStep || "—"}`,
            category: "partner",
            project: "growth",
            href: `/growth/partners/${pr.id}`,
          });
        }
      }
      setEvents(evs);
    })();
  }, []);

  const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const visible = useMemo(() => events.filter((e) => filters[e.project as keyof typeof filters] && filters[e.category as keyof typeof filters]), [events, filters]);

  const days = useMemo(() => {
    const first = new Date(cursor);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const startWeekday = (first.getDay() + 6) % 7;
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let i = 1; i <= last.getDate(); i++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [cursor]);

  const evByDay: Record<string, Ev[]> = {};
  for (const e of visible) {
    const k = isoLocal(e.date);
    (evByDay[k] ||= []).push(e);
  }

  const PROJECT_COLOR: Record<string, string> = {
    unreal: "#3B82F6",
    thefacio: "#10B981",
    freelance: "#F59E0B",
    growth: "#A855F7",
  };

  const categoryIcon = (c: Ev["category"]) => {
    const map: any = { lead: Users, task: ListChecks, meeting: Target, proposal: FileText, content: FileText, pitch: Send, partner: Users2 };
    return map[c] || Users;
  };

  return (
    <Shell>
      <PageHeader
        title={<span><CalendarDays className="inline mr-2" size={20} />Calendário colectivo — {cursor.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}</span>}
        subtitle="Todas as acções de todos os projectos num só lugar"
        actions={
          <>
            <button className="btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>◀</button>
            <button className="btn" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Hoje</button>
            <button className="btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>▶</button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        {/* Filtros */}
        <div className="card flex flex-wrap items-center gap-4 text-xs">
          <span className="label">Projectos:</span>
          {(["unreal", "thefacio", "freelance", "growth"] as const).map((pj) => (
            <label key={pj} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={filters[pj]} onChange={(e) => setFilters({ ...filters, [pj]: e.target.checked })} />
              <span className="w-2 h-2 rounded-full" style={{ background: PROJECT_COLOR[pj] }} />
              {pj === "growth" ? "Crescimento" : PROJECTS[pj as "unreal" | "thefacio" | "freelance"]?.name || pj}
            </label>
          ))}
          <div className="h-3 w-px bg-border" />
          <span className="label">Tipos:</span>
          {(["lead", "task", "meeting", "proposal", "content", "pitch", "partner"] as const).map((c) => (
            <label key={c} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={filters[c]} onChange={(e) => setFilters({ ...filters, [c]: e.target.checked })} />
              {CATEGORY_LABEL[c]}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <div key={d} className="bg-surface p-2 text-xs label text-center">{d}</div>
              ))}
              {days.map((d, i) => {
                if (!d) return <div key={i} className="bg-surface min-h-[100px]" />;
                const k = isoLocal(d);
                const es = evByDay[k] || [];
                const isToday = k === isoLocal(new Date());
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(k)}
                    className={`bg-surface min-h-[100px] p-1.5 text-left text-xs hover:bg-surface2 ${isToday ? "ring-1 ring-blue-500" : ""} ${selected === k ? "bg-surface2" : ""}`}
                  >
                    <div className="font-semibold mb-1">{d.getDate()}</div>
                    <div className="flex flex-wrap gap-0.5">
                      {es.slice(0, 6).map((e) => (
                        <span key={e.id} className="w-2 h-2 rounded-full" style={{ background: PROJECT_COLOR[e.project] }} title={`${PROJECTS[e.project as any]?.name || e.project} · ${CATEGORY_LABEL[e.category]}`} />
                      ))}
                      {es.length > 6 && <span className="text-muted">+{es.length - 6}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel direito */}
          <div className="card">
            <h3 className="font-semibold mb-3">
              {selected ? new Date(selected + "T12:00:00").toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" }) : "Selecciona um dia"}
            </h3>
            {selected && (evByDay[selected] || []).length === 0 && <p className="text-sm text-muted italic">Sem acções.</p>}
            {selected && (
              <ul className="space-y-2 text-sm">
                {(evByDay[selected] || []).sort((a, b) => a.date.getTime() - b.date.getTime()).map((e) => {
                  const Icon = categoryIcon(e.category);
                  return (
                    <li key={e.id} className="flex items-start gap-2 p-2 rounded hover:bg-surface2">
                      <span className="w-2 h-2 mt-1.5 rounded-full shrink-0" style={{ background: PROJECT_COLOR[e.project] }} />
                      <Icon size={14} className="mt-0.5 shrink-0 text-muted" />
                      <div className="flex-1 min-w-0">
                        {e.href ? <Link className="link block truncate" href={e.href}>{e.title}</Link> : <span className="block truncate">{e.title}</span>}
                        <div className="text-xs text-muted">{CATEGORY_LABEL[e.category]} · {e.project === "growth" ? "Crescimento" : PROJECTS[e.project as any]?.name || e.project}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
