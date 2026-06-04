"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PenLine, Radio, Handshake, Sparkles, AlertTriangle, BookOpen, FileText, Send, Users2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { fmtDate } from "@/lib/utils";

const PURPLE = "#A855F7";

export default function GrowthOverview() {
  const [data, setData] = useState<any>(null);
  const [week, setWeek] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    fetch("/api/growth/overview").then((r) => r.json()).then(setData);
    fetch("/api/growth/this-week").then((r) => r.json()).then(setWeek);
  }, []);

  if (!data || !week) return <div className="p-6 text-muted">A carregar...</div>;

  const { kpis, content, media, partners } = data;
  const overdueCount = (week.overdue.posts.length + week.overdue.pitches.length + week.overdue.partnerSteps.length);
  const upcomingCount = (week.upcoming.posts.length + week.upcoming.pitches.length + week.upcoming.partnerSteps.length);

  return (
    <>
      <PageHeader
        title={<span><Sparkles className="inline mr-2" size={20} style={{ color: PURPLE }} />Crescimento</span>}
        subtitle="Conteúdo · Imprensa & Podcasts · Parcerias"
        actions={<button className="btn" onClick={() => setShowGuide((s) => !s)}><BookOpen size={14} /> {showGuide ? "Fechar guia" : "Como funciona?"}</button>}
      />
      <div className="p-6 space-y-6">
        {showGuide && <Guide />}

        {/* Esta semana */}
        <div className="card" style={{ borderColor: PURPLE }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Esta semana</h2>
            <div className="text-sm text-muted">
              {upcomingCount} acções próximos 7 dias · {overdueCount > 0 && <span className="text-amber-400">{overdueCount} em atraso</span>}
            </div>
          </div>

          {overdueCount > 0 && (
            <div className="mb-4 p-3 rounded border border-amber-900/50 bg-amber-950/20">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-amber-400">
                <AlertTriangle size={14} /> Em atraso
              </div>
              <div className="space-y-1 text-sm">
                {week.overdue.posts.map((p: any) => (
                  <Row key={p.id} Icon={FileText} date={p.date} title={p.title} href="/growth/content" />
                ))}
                {week.overdue.pitches.map((p: any) => (
                  <Row key={p.id} Icon={Send} date={p.date} title={`${p.outletName}: ${p.topic}`} href={`/growth/media/${p.outletId}`} />
                ))}
                {week.overdue.partnerSteps.map((i: any) => (
                  <Row key={i.id} Icon={Users2} date={i.date} title={`${i.partnerName}: ${i.nextStep || "—"}`} href={`/growth/partners/${i.partnerId}`} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <ColumnList
              Icon={FileText}
              title="Posts a publicar"
              empty="Sem posts agendados esta semana."
              href="/growth/content"
              items={week.upcoming.posts.map((p: any) => ({ id: p.id, label: p.title, date: p.date, meta: p.pillar }))}
            />
            <ColumnList
              Icon={Send}
              title="Pitches a enviar"
              empty="Sem pitches agendados."
              href="/growth/media"
              items={week.upcoming.pitches.map((p: any) => ({ id: p.id, label: `${p.outletName}: ${p.topic}`, date: p.date, href: `/growth/media/${p.outletId}` }))}
            />
            <ColumnList
              Icon={Users2}
              title="Parceiros a contactar"
              empty="Sem contactos agendados."
              href="/growth/partners"
              items={week.upcoming.partnerSteps.map((i: any) => ({ id: i.id, label: `${i.partnerName}: ${i.nextStep || "—"}`, date: i.date, href: `/growth/partners/${i.partnerId}` }))}
            />
          </div>
        </div>

        {/* KPIs gerais */}
        <div>
          <div className="label mb-2">Resumo geral</div>
          <div className="grid grid-cols-6 gap-3">
            <Kpi label="Publicados este mês" value={String(kpis.publishedMonth)} />
            <Kpi label="Agendados 7d" value={String(kpis.scheduledNext7)} />
            <Kpi label="Pitches em curso" value={String(kpis.pitchesInProgress)} />
            <Kpi label="Parcerias activas" value={String(kpis.activePartners)} accent />
            <Kpi label="Leads via conteúdo" value={String(kpis.contentLeads)} />
            <Kpi label="Leads via parcerias" value={String(kpis.partnerLeads)} />
          </div>
        </div>

        {/* 3 secções */}
        <div className="grid grid-cols-3 gap-4">
          <BigCard href="/growth/content" icon={<PenLine size={24} />} title="Conteúdo"
            description="Pipeline de ideias → rascunhos → agendados → publicados. Mistura 4 pilares: auditoria, integração, distribuição, autoridade."
            stats={[
              { label: "Ideias", value: content.ideia || 0 },
              { label: "Em rascunho", value: content.rascunho || 0 },
              { label: "Agendados", value: content.agendado || 0 },
              { label: "Publicados", value: content.publicado || 0 },
            ]}
          />
          <BigCard href="/growth/media" icon={<Radio size={24} />} title="Imprensa & Podcasts"
            description="Outlets para publicar opinião e podcasts para entrevista. Pitch personalizado por outlet, com follow-up."
            stats={[
              { label: "Identificados", value: media.identificado || 0 },
              { label: "Abordados", value: media.abordado || 0 },
              { label: "Em negociação", value: media.em_negociacao || 0 },
              { label: "Publicados", value: media.publicado || 0 },
            ]}
          />
          <BigCard href="/growth/partners" icon={<Handshake size={24} />} title="Parcerias"
            description="Consultoras e software houses que podem trazer projectos. Cada parceria activa = canal de leads gratuito."
            stats={[
              { label: "A abordar", value: partners.a_abordar || 0 },
              { label: "Abordados", value: partners.abordado || 0 },
              { label: "Reunião agendada", value: partners.reuniao_agendada || 0 },
              { label: "Activas", value: partners.parceria_activa || 0 },
            ]}
          />
        </div>
      </div>
    </>
  );
}

function Guide() {
  return (
    <div className="card" style={{ borderColor: PURPLE, background: "rgba(168,85,247,0.05)" }}>
      <h2 className="font-semibold mb-3 flex items-center gap-2"><BookOpen size={16} /> Como funciona o módulo Crescimento</h2>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-medium mb-1 flex items-center gap-1.5" style={{ color: PURPLE }}><FileText size={14} /> Conteúdo</div>
          <p className="text-muted mb-2">Para construir autoridade e gerar inbound. 24 ideias seed já distribuídas Tue/Thu para os próximos 3 meses.</p>
          <ol className="text-xs text-muted list-decimal pl-4 space-y-1">
            <li>Vais a /growth/content e abres um cartão</li>
            <li>Aplicas um template (drop-down "Aplicar template")</li>
            <li>Escreves o body, ajustas data</li>
            <li>Arrastas para "Rascunho" → "Agendado" → "Publicado"</li>
            <li>Após publicar, adicionas métricas (likes, comments, leads)</li>
          </ol>
        </div>
        <div>
          <div className="font-medium mb-1 flex items-center gap-1.5" style={{ color: PURPLE }}><Send size={14} /> Imprensa & Podcasts</div>
          <p className="text-muted mb-2">Para chegar a audiências maiores via terceiros. Pitches escritos, follow-up, tracking de respostas.</p>
          <ol className="text-xs text-muted list-decimal pl-4 space-y-1">
            <li>Vais a /growth/media e clicas num outlet</li>
            <li>Botão "+ Novo pitch" — escreves a mensagem</li>
            <li>Outlet passa automaticamente a "abordado"</li>
            <li>Depois actualizas para "em negociação" / "agendado" / "publicado"</li>
            <li>Cada pitch fica na timeline do outlet</li>
          </ol>
        </div>
        <div>
          <div className="font-medium mb-1 flex items-center gap-1.5" style={{ color: PURPLE }}><Users2 size={14} /> Parcerias</div>
          <p className="text-muted mb-2">Consultoras / software houses como canal indirecto. Lead trazido por parceiro = trabalho menos.</p>
          <ol className="text-xs text-muted list-decimal pl-4 space-y-1">
            <li>Vais a /growth/partners e abres um parceiro</li>
            <li>"+ Registar interacção" — descreve a conversa</li>
            <li>Arrastas no kanban quando o estado muda</li>
            <li>Quando marcas "parceria activa" → tarefa de follow-up trimestral é criada automaticamente</li>
            <li>"Vincular lead" liga um lead existente ao parceiro que o trouxe</li>
          </ol>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border text-xs text-muted">
        <strong className="text-zinc-300">Onde isto aparece no resto da app:</strong> tudo o que tiver data (posts agendados, pitches, partner next-steps) aparece automaticamente em <code>/[projecto]/calendar</code> com toggles para esconder.
      </div>
    </div>
  );
}

function Row({ Icon, date, title, href }: { Icon: any; date: string; title: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 hover:bg-surface2 px-2 py-1 rounded">
      <Icon size={14} style={{ color: PURPLE }} />
      <span className="text-xs text-muted shrink-0 w-20">{fmtDate(date)}</span>
      <span className="truncate">{title}</span>
    </Link>
  );
}

function ColumnList({ Icon, title, items, empty, href }: { Icon: any; title: string; items: { id: string; label: string; date: string; href?: string; meta?: string }[]; empty: string; href: string }) {
  return (
    <div>
      <Link href={href} className="text-sm font-medium hover:underline mb-2 inline-flex items-center gap-1.5">
        <Icon size={14} style={{ color: PURPLE }} /> {title}
      </Link>
      <div className="space-y-1.5 text-sm">
        {items.length === 0 && <p className="text-xs text-muted italic">{empty}</p>}
        {items.map((it) => (
          <Link key={it.id} href={it.href || href} className="block p-2 rounded bg-surface2 hover:bg-surface border border-border">
            <div className="text-xs text-muted">{fmtDate(it.date)} {it.meta && <span>· {it.meta}</span>}</div>
            <div className="text-sm truncate">{it.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="mt-1 text-2xl font-semibold" style={accent ? { color: PURPLE } : {}}>{value}</div>
    </div>
  );
}

function BigCard({ href, icon, title, description, stats }: { href: string; icon: React.ReactNode; title: string; description: string; stats: { label: string; value: number }[] }) {
  return (
    <Link href={href} className="card hover:border-zinc-600 transition block">
      <div className="flex items-center gap-3 mb-2">
        <div style={{ color: PURPLE }}>{icon}</div>
        <div className="text-lg font-semibold">{title}</div>
      </div>
      <p className="text-xs text-muted mb-3">{description}</p>
      <div className="space-y-1 text-sm">
        {stats.map((b) => (
          <div key={b.label} className="flex justify-between">
            <span className="text-muted">{b.label}</span>
            <span className="font-medium">{b.value}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}
