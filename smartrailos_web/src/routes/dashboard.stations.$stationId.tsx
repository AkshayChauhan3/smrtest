import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Building2, TrainFront, Users, Activity } from "lucide-react";
import { TrainCard } from "@/components/srail/train-card";
import { OccupancyBar } from "@/components/srail/occupancy-bar";
import { KpiCard } from "@/components/srail/kpi-card";
import { AnimatedNumber } from "@/components/srail/animated-number";
import { useStations, useTrains, useStationCurrent, useStationFeature } from "@/lib/api/hooks";
import { SectionHeader } from "@/routes/dashboard.index";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/stations/$stationId")({
  head: ({ params }) => ({
    meta: [
      { title: `Station ${params.stationId} · SmartRail OS` },
      {
        name: "description",
        content: `Live trains, occupancy and platform activity for station ${params.stationId}.`,
      },
    ],
  }),
  component: StationDetail,
  errorComponent: ({ error }) => (
    <div className="px-6 py-10 text-sm text-danger" role="alert">
      Failed to load station: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="px-6 py-10 text-sm text-slate-400">
      Station not found.{" "}
      <Link to="/dashboard/stations" className="text-accent-cyan hover:underline">
        Back to all stations
      </Link>
    </div>
  ),
});

function StationDetail() {
  const { stationId } = Route.useParams();
  const stationsQ = useStations();
  const trainsQ = useTrains();
  const stationCurrentQ = useStationCurrent(stationId);
  const stationFeatureQ = useStationFeature(stationId);

  if (stationsQ.isLoading || trainsQ.isLoading || stationCurrentQ.isLoading || stationFeatureQ.isLoading) {
    return <StationDetailSkeleton />;
  }

  const station = stationsQ.data?.find((s) => s.id === stationId);
  if (stationsQ.data && !station) throw notFound();

  const allTrains = trainsQ.data ?? [];
  const stationTrains = station
    ? allTrains.filter(
        (t) =>
          t.currentStationId.toLowerCase() === station.name.toLowerCase() ||
          t.nextStationId.toLowerCase() === station.name.toLowerCase(),
      )
    : [];

  const atStation = stationTrains.filter(
    (t) => t.currentStationId.toLowerCase() === station?.name.toLowerCase(),
  );
  const approaching = stationTrains.filter(
    (t) => t.nextStationId.toLowerCase() === station?.name.toLowerCase(),
  );

  const allCoaches = stationTrains.flatMap((t) => t.coaches);
  const avgOccupancy =
    allCoaches.length > 0
      ? Math.round(
          allCoaches.reduce((a, c) => a + c.occupancy, 0) / allCoaches.length,
        )
      : 0;
  const headPassengers = allCoaches.reduce(
    (a, c) => a + Math.round((c.capacity * c.occupancy) / 100),
    0,
  );

  const currentData = stationCurrentQ.data;
  const featureData = stationFeatureQ.data;

  return (
    <div className="animate-fade-in-up space-y-8 px-4 py-6 md:px-8 md:py-8">
      <header className="space-y-3">
        <Link
          to="/dashboard/stations"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-accent-cyan"
        >
          <ArrowLeft className="size-3.5" /> All Stations
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "grid size-12 place-items-center rounded-lg",
                station?.line === "red"
                  ? "bg-danger/10 text-danger"
                  : "bg-accent-cyan/10 text-accent-cyan",
              )}
            >
              <Building2 className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-white">
                {station?.name ?? stationId}
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {station?.line === "red" ? "Red Line" : "Blue Line"} · ID{" "}
                {stationId}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Trains at Station"
          value={<AnimatedNumber value={atStation.length} format={(n) => String(Math.round(n)).padStart(2, "0")} />}
          icon={<TrainFront className="size-4" />}
        />
        <KpiCard
          label="Approaching"
          value={<AnimatedNumber value={approaching.length} format={(n) => String(Math.round(n)).padStart(2, "0")} />}
          icon={<Activity className="size-4" />}
        />
        <KpiCard
          label="Passengers Onboard"
          value={<AnimatedNumber value={headPassengers} />}
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="Avg Occupancy"
          value={<AnimatedNumber value={avgOccupancy} format={(n) => `${Math.round(n)}%`} />}
          deltaTone={avgOccupancy >= 75 ? "warning" : "positive"}
          delta={avgOccupancy >= 90 ? "Critical" : avgOccupancy >= 75 ? "High" : "Healthy"}
          icon={<Users className="size-4" />}
        />
      </section>

      {/* ── Table 1: Station Current State (SQLite) ── */}
      <section className="space-y-4">
        <SectionHeader
          title="Station Current State Table"
          right="Live Station Table"
        />
        <div className="overflow-hidden rounded-xl border border-white/5 bg-obsidian-900/50 backdrop-blur-md">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-obsidian-950/80 font-mono text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Current Train ID</th>
                <th className="px-6 py-4 font-semibold">Current Passenger Count</th>
                <th className="px-6 py-4 font-semibold">Arrival Time</th>
                <th className="px-6 py-4 font-semibold">Departure Time</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentData && currentData.train_id ? (
                <tr className="hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-accent-cyan flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                    {currentData.train_id}
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {currentData.current_passenger_count?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">
                    {currentData.arrival_time || "--:--"}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">
                    {currentData.departure_time || "--:--"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                      DWELLING
                    </span>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                    No train currently dwelling at station platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Table 2: Station Feature & ML Predictions (SQLite) ── */}
      <section className="space-y-4">
        <SectionHeader
          title="Station Feature Predictions Table"
          right="ML & Metro Engine Analytics"
        />
        <div className="overflow-hidden rounded-xl border border-white/5 bg-obsidian-900/50 backdrop-blur-md">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-obsidian-950/80 font-mono text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Upcoming Train ID</th>
                <th className="px-6 py-4 font-semibold">Est. Arrival</th>
                <th className="px-6 py-4 font-semibold">Est. Departure</th>
                <th className="px-6 py-4 font-semibold">Incoming Pax</th>
                <th className="px-6 py-4 font-semibold text-rose-400">Alighting (Out)</th>
                <th className="px-6 py-4 font-semibold text-emerald-400">Boarding (In)</th>
                <th className="px-6 py-4 font-semibold text-right">Final Pax at Station</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {featureData && featureData.train_id ? (
                <tr className="hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-accent-cyan flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-accent-cyan/80 animate-pulse" />
                    {featureData.train_id}
                  </td>
                  <td className="px-6 py-4 font-mono text-white font-semibold">
                    {featureData.estimated_arrival_time || "--:--"}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">
                    {featureData.estimated_departure_time || "--:--"}
                  </td>
                  <td className="px-6 py-4 text-white">
                    {featureData.estimated_passenger_incoming?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-6 py-4 text-rose-400 font-medium">
                    -{featureData.estimated_alighting?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-medium">
                    +{featureData.estimated_boarding?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-right">
                    {featureData.estimated_station_passenger_count?.toLocaleString() ?? 0}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">
                    No upcoming train predictions available for this station.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>


      <section>
        <SectionHeader
          title="Currently At Station"
          right={`${atStation.length} active`}
        />
        <div className="mt-4 space-y-4">
          {atStation.length === 0 && (
            <div className="rounded-xl border border-white/5 bg-obsidian-900 p-6 text-sm text-slate-500">
              No trains currently at this station.
            </div>
          )}
          {atStation.map((t, i) => (
            <div key={t.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <TrainCard train={t} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Approaching"
          right={`${approaching.length} inbound`}
        />
        <div className="mt-4 space-y-4">
          {approaching.length === 0 && (
            <div className="rounded-xl border border-white/5 bg-obsidian-900 p-6 text-sm text-slate-500">
              No inbound trains right now.
            </div>
          )}
          {approaching.map((t, i) => (
            <div key={t.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <TrainCard train={t} />
            </div>
          ))}
        </div>
      </section>

      {allCoaches.length > 0 && (
        <section className="rounded-xl border border-white/5 bg-obsidian-900 p-6">
          <SectionHeader title="Platform Coach Load" right="Live" />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {stationTrains.flatMap((t) =>
              t.coaches.map((c) => (
                <OccupancyBar
                  key={`${t.id}-${c.id}`}
                  value={c.occupancy}
                  label={`${t.id} · ${c.label}`}
                />
              )),
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function StationDetailSkeleton() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-8 w-72" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-3 h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="skeleton h-40 w-full rounded-xl" />
    </div>
  );
}
