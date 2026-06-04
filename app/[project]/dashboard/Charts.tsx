"use client";
import { useRouter, useParams } from "next/navigation";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

const TOOLTIP_STYLE = {
  contentStyle: { background: "#141417", border: "1px solid #26262d", borderRadius: 6, color: "#f4f4f5" },
  itemStyle: { color: "#f4f4f5" },
  labelStyle: { color: "#a1a1aa", fontSize: 12, marginBottom: 4 },
  cursor: { fill: "#26262d", opacity: 0.4 } as any,
};

export function DashboardCharts({
  byStatus, sectorData, months,
}: {
  byStatus: { name: string; value: number }[];
  sectorData: { name: string; value: number }[];
  months: { name: string; pipeline: number; receita: number }[];
}) {
  const router = useRouter();
  const params = useParams<{ project: string }>();
  const go = (qs: string) => router.push(`/${params.project}/leads?${qs}`);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card">
        <h3 className="font-semibold mb-3 text-sm">Pipeline por estado <span className="text-muted font-normal">(clica numa barra)</span></h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byStatus} layout="vertical" margin={{ left: 60 }}>
            <XAxis type="number" stroke="#71717a" fontSize={11} />
            <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} width={120} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="value" fill="#3B82F6" cursor="pointer" onClick={(d: any) => go(`status=${encodeURIComponent(d.name)}`)} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3 text-sm">Pipeline ao longo do tempo</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={months}>
            <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
            <YAxis stroke="#71717a" fontSize={11} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="pipeline" stroke="#3B82F6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3 text-sm">Distribuição por sector <span className="text-muted font-normal">(clica numa fatia)</span></h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={sectorData}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              cursor="pointer"
              onClick={(d: any) => go(`sector=${encodeURIComponent(d.name)}`)}
              label={(entry: any) => entry.name}
            >
              {sectorData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3 text-sm">Receita por mês</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={months}>
            <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
            <YAxis stroke="#71717a" fontSize={11} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="receita" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
