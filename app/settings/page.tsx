"use client";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";

export default function SettingsPage() {
  const [restoreText, setRestoreText] = useState("");
  const [status, setStatus] = useState<string>("");

  async function backup() {
    const res = await fetch("/api/backup");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unreal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function restore() {
    if (!restoreText.trim()) return;
    setStatus("A restaurar...");
    const res = await fetch("/api/backup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: restoreText,
    });
    setStatus(res.ok ? "✓ Restauro concluído" : "✗ Erro no restauro");
  }

  return (
    <Shell>
      <PageHeader title="Settings" subtitle="Backup e restauro" />
      <div className="p-6 max-w-3xl space-y-6">
        <div className="card">
          <h2 className="font-semibold mb-2">Backup</h2>
          <p className="text-sm text-muted mb-3">Exporta todos os dados como JSON.</p>
          <button onClick={backup} className="btn btn-primary">Exportar JSON</button>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">Restauro</h2>
          <p className="text-sm text-muted mb-3">Cola o conteúdo do JSON de backup.</p>
          <textarea
            className="input min-h-[160px] font-mono text-xs"
            value={restoreText}
            onChange={(e) => setRestoreText(e.target.value)}
            placeholder='{ "projects": [...], "leads": [...] }'
          />
          <div className="mt-3 flex items-center gap-3">
            <button onClick={restore} className="btn">Restaurar</button>
            <span className="text-sm text-muted">{status}</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}
