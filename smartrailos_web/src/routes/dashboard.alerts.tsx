import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCheck,
  X,
  Loader2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  TrainFront,
  Compass,
  Clock,
  Sparkles,
  Filter,
} from "lucide-react";
import { useAlerts, useAcknowledgeAlert, useResolveAlert } from "@/lib/api/hooks";
import { type Alert } from "@/lib/mock/data";

export const Route = createFileRoute("/dashboard/alerts")({
  head: () => ({
    meta: [
      { title: "Alert Center · SmartRail OS Operations" },
      { name: "description", content: "Acknowledge, dispatch, and resolve real-time operational railway alerts." },
    ],
  }),
  component: AlertsPage,
});

const ALERT_SEVERITY_STYLES: Record<string, { badge: string; border: string; bg: string; icon: any }> = {
  Emergency: {
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-500/10",
    border: "border-rose-500/30 hover:border-rose-500/50",
    bg: "bg-gradient-to-r from-rose-950/40 via-obsidian-900 to-obsidian-900",
    icon: Flame,
  },
  Overcrowding: {
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    border: "border-amber-500/30 hover:border-amber-500/50",
    bg: "bg-gradient-to-r from-amber-950/30 via-obsidian-900 to-obsidian-900",
    icon: AlertTriangle,
  },
  "Platform Congestion": {
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/50",
    border: "border-orange-500/30 hover:border-orange-500/50",
    bg: "bg-gradient-to-r from-orange-950/30 via-obsidian-900 to-obsidian-900",
    icon: AlertTriangle,
  },
  "Coach Full": {
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    border: "border-blue-500/30 hover:border-blue-500/50",
    bg: "bg-gradient-to-r from-blue-950/30 via-obsidian-900 to-obsidian-900",
    icon: TrainFront,
  },
  "System Warning": {
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/50",
    border: "border-white/10 hover:border-white/20",
    bg: "bg-obsidian-900/80",
    icon: ShieldAlert,
  },
};

function AlertsPage() {
  const alertsQ = useAlerts();
  const ackM = useAcknowledgeAlert();
  const resM = useResolveAlert();

  const [filter, setFilter] = useState<"all" | "active" | "emergency" | "acknowledged" | "resolved">("active");
  const [pendingAckId, setPendingAckId] = useState<string | null>(null);
  const [pendingResId, setPendingResId] = useState<string | null>(null);

  const rawAlerts: (Alert & { stationName?: string | null; trainId?: string | null })[] = alertsQ.data || [];

  // Priority sorting: Unresolved Emergency first, then High, then others, resolved last
  const sortedAlerts = useMemo(() => {
    const rank: Record<string, number> = {
      Emergency: 0,
      Overcrowding: 1,
      "Platform Congestion": 2,
      "Coach Full": 3,
      "System Warning": 4,
    };

    return [...rawAlerts].sort((a, b) => {
      // 1. Unresolved comes before resolved
      if (a.resolved !== b.resolved) {
        return a.resolved ? 1 : -1;
      }
      // 2. Severity rank (Emergency is 0 -> 1st priority)
      const rankA = rank[a.severity] ?? 99;
      const rankB = rank[b.severity] ?? 99;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return 0;
    });
  }, [rawAlerts]);

  // Counts
  const activeCount = rawAlerts.filter((a) => !a.resolved).length;
  const emergencyCount = rawAlerts.filter((a) => a.severity === "Emergency" && !a.resolved).length;
  const acknowledgedCount = rawAlerts.filter((a) => a.acknowledged && !a.resolved).length;
  const resolvedCount = rawAlerts.filter((a) => a.resolved).length;

  // Filtered list
  const list = useMemo(() => {
    return sortedAlerts.filter((a) => {
      if (filter === "all") return true;
      if (filter === "active") return !a.resolved;
      if (filter === "emergency") return a.severity === "Emergency" && !a.resolved;
      if (filter === "acknowledged") return a.acknowledged && !a.resolved;
      if (filter === "resolved") return a.resolved;
      return true;
    });
  }, [sortedAlerts, filter]);

  // Top Emergency Alert (if active)
  const topEmergency = sortedAlerts.find((a) => a.severity === "Emergency" && !a.resolved);

  const handleAcknowledge = (id: string) => {
    setPendingAckId(id);
    ackM.mutate(id, {
      onSettled: () => setPendingAckId(null),
    });
  };

  const handleResolve = (id: string) => {
    setPendingResId(id);
    resM.mutate(id, {
      onSettled: () => setPendingResId(null),
    });
  };

  return (
    <div className="animate-fade-in-up space-y-6 px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-rose-400">
              Live Real-Time Safety & Operational Monitoring
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl">
            Alert & Incident Command Center
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Acknowledge and resolve live incidents with direct SQLite database persistence and automated dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-white/10 bg-obsidian-900/80 px-3 py-1.5 font-mono text-xs font-bold text-accent-cyan shadow-inner">
            {activeCount} Active · {emergencyCount} Critical Emergency
          </span>
        </div>
      </div>

      {/* Top Priority Emergency Banner */}
      {topEmergency && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500/50 bg-gradient-to-r from-rose-950/80 via-obsidian-950/90 to-obsidian-950/90 p-5 shadow-2xl shadow-rose-950/40 backdrop-blur-xl">
          <div className="absolute -right-8 -top-8 size-40 rounded-full bg-rose-500/10 blur-2xl" />
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-400 shadow-inner">
                <Flame className="size-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-rose-300">
                    <span className="size-1.5 rounded-full bg-rose-400 animate-ping" />
                    Priority 1 Emergency
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{topEmergency.time || "Just now"}</span>
                </div>
                <h3 className="text-base font-bold text-white md:text-lg">{topEmergency.title}</h3>
                <p className="text-xs text-slate-300">{topEmergency.description}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 pt-2 md:pt-0">
              <button
                onClick={() => handleAcknowledge(topEmergency.id)}
                disabled={topEmergency.acknowledged || (ackM.isPending && pendingAckId === topEmergency.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-sm",
                  topEmergency.acknowledged
                    ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300 cursor-not-allowed opacity-80"
                    : "border-rose-500/50 bg-rose-600/30 text-rose-200 hover:bg-rose-600/50"
                )}
              >
                {ackM.isPending && pendingAckId === topEmergency.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : topEmergency.acknowledged ? (
                  <CheckCheck className="size-3.5" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>{topEmergency.acknowledged ? "✓ Acknowledged" : "Acknowledge"}</span>
              </button>

              <button
                onClick={() => handleResolve(topEmergency.id)}
                disabled={resM.isPending && pendingResId === topEmergency.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-accent-cyan/50 bg-accent-cyan px-3.5 py-2 text-xs font-black text-obsidian-950 shadow-lg shadow-accent-cyan/20 transition-all hover:bg-accent-cyan/90 disabled:opacity-50"
              >
                {resM.isPending && pendingResId === topEmergency.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
                <span>Resolve Incident</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-obsidian-900/80 p-1.5 backdrop-blur-md">
        <button
          onClick={() => setFilter("active")}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
            filter === "active"
              ? "bg-accent-cyan text-obsidian-950 shadow-md font-black"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          Active Incidents ({activeCount})
        </button>

        <button
          onClick={() => setFilter("emergency")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
            filter === "emergency"
              ? "bg-rose-600 text-white shadow-md font-black"
              : "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          )}
        >
          <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
          Critical Emergency ({emergencyCount})
        </button>

        <button
          onClick={() => setFilter("acknowledged")}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
            filter === "acknowledged"
              ? "bg-emerald-600 text-white shadow-md font-black"
              : "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          )}
        >
          Acknowledged ({acknowledgedCount})
        </button>

        <button
          onClick={() => setFilter("resolved")}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
            filter === "resolved"
              ? "bg-white/20 text-white shadow-md font-black"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          Resolved Archive ({resolvedCount})
        </button>

        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
            filter === "all"
              ? "bg-white/20 text-white shadow-md font-black"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          All ({rawAlerts.length})
        </button>
      </div>

      {/* Incident List */}
      <div className="space-y-3.5">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-obsidian-900/60 p-12 text-center backdrop-blur-md">
            <ShieldAlert className="mx-auto size-8 text-slate-600" />
            <h4 className="mt-3 text-sm font-bold text-white">No incidents in this view</h4>
            <p className="mt-1 text-xs text-slate-500">All railway sectors are currently operating safely.</p>
          </div>
        ) : (
          list.map((a) => {
            const style = ALERT_SEVERITY_STYLES[a.severity] || ALERT_SEVERITY_STYLES["System Warning"];
            const Icon = style.icon;
            const isAckPending = ackM.isPending && pendingAckId === a.id;
            const isResPending = resM.isPending && pendingResId === a.id;

            return (
              <div
                key={a.id}
                className={cn(
                  "relative rounded-2xl border p-5 transition-all backdrop-blur-md",
                  style.border,
                  style.bg,
                  a.resolved && "opacity-50 bg-obsidian-950/60 border-white/5"
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left info */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl border",
                        style.badge
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                            style.badge
                          )}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {a.severity}
                        </span>

                        {a.stationName && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                            <Compass className="size-3 text-accent-cyan" />
                            {a.stationName}
                          </span>
                        )}

                        {a.trainId && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-950/40 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                            <TrainFront className="size-3 text-blue-400" />
                            {a.trainId}
                          </span>
                        )}

                        <span className="font-mono text-[11px] text-slate-500">
                          {a.time || "Just now"}
                        </span>

                        {a.acknowledged && !a.resolved && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <CheckCheck className="size-3" />
                            Acknowledged
                          </span>
                        )}

                        {a.resolved && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-500/30 bg-slate-800/40 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                            ✓ Resolved
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white md:text-base">{a.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{a.description}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!a.resolved && (
                    <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                      <button
                        onClick={() => handleAcknowledge(a.id)}
                        disabled={a.acknowledged || isAckPending}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all",
                          a.acknowledged
                            ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 cursor-not-allowed opacity-80"
                            : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-950/30 hover:text-emerald-300"
                        )}
                      >
                        {isAckPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : a.acknowledged ? (
                          <CheckCheck className="size-3.5 text-emerald-400" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        <span>{a.acknowledged ? "Acknowledged" : "Acknowledge"}</span>
                      </button>

                      <button
                        onClick={() => handleResolve(a.id)}
                        disabled={isResPending}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-accent-cyan/40 bg-accent-cyan/15 px-3 py-1.5 text-xs font-bold text-accent-cyan transition-all hover:bg-accent-cyan hover:text-obsidian-950 disabled:opacity-50"
                      >
                        {isResPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                        <span>Resolve</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
