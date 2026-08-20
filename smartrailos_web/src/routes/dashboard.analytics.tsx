import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { KpiCard } from "@/components/srail/kpi-card";
import { HOURLY_FLOW, WEEKLY_TREND } from "@/lib/mock/data";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Clock, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · SmartRail OS" },
      { name: "description", content: "Operational analytics for station performance and ridership." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="Operational Analytics" right="Last 7 days" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Ridership" value="218,402" delta="+4.2%" deltaTone="positive" icon={<Users className="size-4" />} />
        <KpiCard label="On-Time Performance" value="96.8%" delta="+0.6 pp" deltaTone="positive" icon={<Clock className="size-4" />} />
        <KpiCard label="Avg Dwell Time" value="42s" delta="-3s" deltaTone="positive" icon={<Activity className="size-4" />} />
        <KpiCard label="Peak Load Factor" value="0.82" delta="Stable" deltaTone="neutral" icon={<TrendingUp className="size-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Hourly Flow (today)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HOURLY_FLOW} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#121216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="inflow" stroke="#2dd4bf" strokeWidth={2} fill="url(#ag)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Ridership">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEEKLY_TREND} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#121216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="passengers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <div className="mt-4 h-64">{children}</div>
    </div>
  );
}
