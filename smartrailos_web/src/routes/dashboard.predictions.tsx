import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { HOURLY_FLOW, TRAINS, riskFor } from "@/lib/mock/data";
import { Sparkles, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard/predictions")({
  head: () => ({
    meta: [
      { title: "Predictions · SmartRail OS" },
      { name: "description", content: "Forward-looking forecasts for trains, crowds and platform load." },
    ],
  }),
  component: Predictions,
});

function Predictions() {
  const forecast = HOURLY_FLOW.slice(14, 22).map((d) => ({ ...d, predicted: Math.round(d.inflow * 1.08) }));
  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="Predictive Intelligence" right="Horizon · 60 min" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PredCard title="Stadium Discharge Surge" eta="24 min" value="+4,500 pax/hr" tone="text-warning" />
        <PredCard title="Platform 2 Saturation" eta="12 min" value="89% density" tone="text-danger" />
        <PredCard title="Optimal Coach (BL-UP-001)" eta="2 min" value="Coach 1 · 38%" tone="text-success" />
      </div>

      <div className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Predicted vs Actual Flow</h3>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-cyan">
            <TrendingUp className="size-3" /> +8% over baseline
          </span>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#121216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="inflow" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="predicted" stroke="#2dd4bf" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
        <h3 className="text-sm font-bold text-white">Per-Train Forecast</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {TRAINS.map((t) => {
            const avg = Math.round(t.coaches.reduce((s, c) => s + c.occupancy, 0) / t.coaches.length);
            const pred = Math.min(99, avg + 8);
            return (
              <div key={t.id} className="rounded-lg border border-white/5 bg-obsidian-800/40 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-accent-cyan">{t.id}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{riskFor(t)} risk</span>
                </div>
                <div className="mt-2 text-sm font-bold text-white">{t.direction}</div>
                <div className="mt-3 flex items-end gap-6 font-mono">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Now</div>
                    <div className="text-xl font-bold text-white">{avg}%</div>
                  </div>
                  <div className="text-slate-600">→</div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">In 5 min</div>
                    <div className="text-xl font-bold text-accent-cyan">{pred}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PredCard({ title, eta, value, tone }: { title: string; eta: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent-cyan">
        <Sparkles className="size-3" /> Forecast
      </div>
      <h4 className="mt-2 text-sm font-bold text-white">{title}</h4>
      <div className={`mt-3 font-mono text-2xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">Horizon · {eta}</div>
    </div>
  );
}
