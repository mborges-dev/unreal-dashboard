"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

export default function ImportPage() {
  const params = useParams<{ project: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<"linkedin" | "csv">("linkedin");
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [csv, setCsv] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function doPreview() {
    const r = await fetch("/api/import/linkedin", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ raw, projectId: params.project, preview: true }),
    });
    setPreview(await r.json());
  }
  async function importLinkedin() {
    setBusy(true);
    const r = await fetch("/api/import/linkedin", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ raw, projectId: params.project }),
    });
    const j = await r.json();
    if (j.id) router.push(`/${params.project}/leads/${j.id}`);
    setBusy(false);
  }

  function handleCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setCsv(text);
      const firstLine = text.split(/\r?\n/)[0];
      const headers = firstLine.split(",").map((h) => h.replace(/^"|"$/g, "").trim());
      setCsvHeaders(headers);
      const auto: Record<string, string> = {};
      for (const k of ["name", "company", "role", "sector", "email", "phone", "linkedinUrl", "status", "temperature", "setupValue", "monthlyValue", "probability", "notes"]) {
        const m = headers.find((h) => h.toLowerCase().includes(k.toLowerCase().replace("value", "")));
        if (m) auto[k] = m;
      }
      setMapping(auto);
    };
    reader.readAsText(file);
  }

  async function importCsv() {
    setBusy(true);
    const r = await fetch("/api/import/csv", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ csv, projectId: params.project, mapping }),
    });
    const j = await r.json();
    alert(`${j.created} leads importados`);
    router.push(`/${params.project}/leads`);
    setBusy(false);
  }

  return (
    <>
      <PageHeader title="Importar leads" />
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <button className={`btn ${tab === "linkedin" ? "btn-primary" : ""}`} onClick={() => setTab("linkedin")}>Conversa LinkedIn</button>
          <button className={`btn ${tab === "csv" ? "btn-primary" : ""}`} onClick={() => setTab("csv")}>CSV</button>
        </div>

        {tab === "linkedin" && (
          <div className="card space-y-3">
            <p className="text-sm text-muted">Cola a conversa exportada do LinkedIn (formato markdown).</p>
            <textarea className="input min-h-[300px] font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn" onClick={doPreview}>Pré-visualizar</button>
              <button className="btn btn-primary" disabled={!raw.trim() || busy} onClick={importLinkedin}>Importar</button>
            </div>
            {preview && (
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div><span className="label">Nome:</span> {preview.name || "—"}</div>
                <div><span className="label">Cargo:</span> {preview.role || "—"}</div>
                <div><span className="label">LinkedIn:</span> {preview.linkedinUrl || "—"}</div>
                <div><span className="label">Mensagens detectadas:</span> {preview.messages.length}</div>
                <div><span className="label">Sugerido:</span> {preview.suggested.status} · {preview.suggested.temperature}</div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-muted">Ver mensagens</summary>
                  <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {preview.messages.map((m: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-surface2 rounded">
                        <span className="text-muted">[{m.direction}] {new Date(m.date).toLocaleString("pt-PT")}</span>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        {tab === "csv" && (
          <div className="card space-y-3">
            <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />
            {csvHeaders.length > 0 && (
              <>
                <p className="text-sm text-muted">Mapeia colunas do CSV para campos do lead:</p>
                <div className="grid grid-cols-2 gap-2">
                  {["name", "company", "role", "sector", "email", "phone", "linkedinUrl", "status", "temperature", "setupValue", "monthlyValue", "probability", "notes"].map((f) => (
                    <div key={f}>
                      <div className="label mb-1">{f}</div>
                      <select className="input" value={mapping[f] || ""} onChange={(e) => setMapping({ ...mapping, [f]: e.target.value })}>
                        <option value="">—</option>
                        {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" disabled={busy} onClick={importCsv}>Importar CSV</button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
