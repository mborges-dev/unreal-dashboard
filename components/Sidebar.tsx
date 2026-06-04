"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Calendar, Wallet, ListChecks, Settings, Globe, Send, Target,
  Sparkles, PenLine, Radio, Handshake, CalendarDays,
} from "lucide-react";
import { PROJECTS, PROJECT_IDS, type ProjectId } from "@/lib/projects";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "closing", label: "Closing", icon: Target, only: ["unreal"] as string[] | undefined },
  { href: "leads", label: "Leads", icon: Users },
  { href: "outreach", label: "Outreach", icon: Send, only: ["unreal", "thefacio"] as string[] | undefined },
  { href: "proposals", label: "Propostas", icon: FileText, only: ["unreal", "thefacio"] as string[] | undefined },
  { href: "calendar", label: "Calendário", icon: Calendar },
  { href: "finance", label: "Finanças", icon: Wallet },
  { href: "tasks", label: "Tarefas", icon: ListChecks },
];

export function Sidebar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const parts = pathname.split("/").filter(Boolean);
  const projectId = (PROJECT_IDS.includes(parts[0] as ProjectId) ? parts[0] : "unreal") as ProjectId;
  const currentSection = parts[1] || "dashboard";
  const project = PROJECTS[projectId];

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <div className="font-semibold text-sm">UNREAL Performance</div>
        <div className="text-xs text-muted">Dashboard</div>
      </div>
      <div className="p-3 border-b border-border">
        <div className="label mb-2">Projecto</div>
        <div className="flex flex-col gap-1">
          {PROJECT_IDS.map((id) => {
            const p = PROJECTS[id];
            const active = id === projectId;
            return (
              <button
                key={id}
                onClick={() => router.push(`/${id}/${id === "global" ? "" : currentSection}`)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left border border-transparent",
                  active ? "bg-surface2 border-border" : "hover:bg-surface2"
                )}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>
      <nav className="p-3 flex-1 flex flex-col gap-0.5">
        {projectId === "global" ? (
          <Link
            href="/global"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded text-sm",
              pathname === "/global" ? "bg-surface2" : "hover:bg-surface2"
            )}
          >
            <Globe size={16} /> Visão Global
          </Link>
        ) : (
          NAV.filter((n) => !n.only || n.only.includes(projectId)).map((n) => {
            const Icon = n.icon;
            const active = currentSection === n.href;
            return (
              <Link
                key={n.href}
                href={`/${projectId}/${n.href}`}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded text-sm",
                  active ? "bg-surface2" : "hover:bg-surface2"
                )}
                style={active ? { borderLeft: `2px solid ${project.color}` } : {}}
              >
                <Icon size={16} /> {projectId === "freelance" && n.href === "leads" ? "Candidaturas" : n.label}
              </Link>
            );
          })
        )}
      </nav>
      <div className="p-3 border-t border-border">
        <Link href="/calendar" className={cn("flex items-center gap-2 px-2 py-1.5 rounded text-sm mb-3", pathname === "/calendar" ? "bg-surface2" : "hover:bg-surface2")} style={pathname === "/calendar" ? { borderLeft: "2px solid #ffffff" } : {}}>
          <CalendarDays size={16} /> Calendário colectivo
        </Link>
        <div className="label mb-2 flex items-center gap-1.5" style={{ color: "#A855F7" }}>
          <Sparkles size={12} /> Crescimento
        </div>
        <div className="flex flex-col gap-0.5">
          <Link href="/growth" className={cn("flex items-center gap-2 px-2 py-1.5 rounded text-sm", pathname === "/growth" ? "bg-surface2" : "hover:bg-surface2")} style={pathname === "/growth" ? { borderLeft: "2px solid #A855F7" } : {}}>
            <Sparkles size={14} /> Overview
          </Link>
          <Link href="/growth/content" className={cn("flex items-center gap-2 px-2 py-1.5 rounded text-sm", pathname.startsWith("/growth/content") ? "bg-surface2" : "hover:bg-surface2")} style={pathname.startsWith("/growth/content") ? { borderLeft: "2px solid #A855F7" } : {}}>
            <PenLine size={14} /> Conteúdo
          </Link>
          <Link href="/growth/media" className={cn("flex items-center gap-2 px-2 py-1.5 rounded text-sm", pathname.startsWith("/growth/media") ? "bg-surface2" : "hover:bg-surface2")} style={pathname.startsWith("/growth/media") ? { borderLeft: "2px solid #A855F7" } : {}}>
            <Radio size={14} /> Imprensa & Podcasts
          </Link>
          <Link href="/growth/partners" className={cn("flex items-center gap-2 px-2 py-1.5 rounded text-sm", pathname.startsWith("/growth/partners") ? "bg-surface2" : "hover:bg-surface2")} style={pathname.startsWith("/growth/partners") ? { borderLeft: "2px solid #A855F7" } : {}}>
            <Handshake size={14} /> Parcerias
          </Link>
        </div>
      </div>
      <div className="p-3 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-surface2"
        >
          <Settings size={16} /> Settings
        </Link>
      </div>
    </aside>
  );
}
