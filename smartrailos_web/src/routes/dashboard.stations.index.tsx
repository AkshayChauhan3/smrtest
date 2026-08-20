import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { useStations, useTrains } from "@/lib/api/hooks";
import { SectionHeader } from "@/routes/dashboard.index";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/stations/")({
  head: () => ({
    meta: [
      { title: "Stations · SmartRail OS" },
      {
        name: "description",
        content:
          "Browse every Ahmedabad Metro station and drill into live train activity.",
      },
    ],
  }),
  component: StationsIndex,
});

function StationsIndex() {
  const stationsQ = useStations();
  const trainsQ = useTrains();

  const stations = stationsQ.data ?? [];
  const trains = trainsQ.data ?? [];

  // Count trains per station by matching the train's current station ID to
  // the station ID.
  const trainsByStation = new Map<string, number>();
  for (const t of trains) {
    const key = t.currentStationId.toLowerCase();
    trainsByStation.set(key, (trainsByStation.get(key) ?? 0) + 1);
  }

  return (
    <div className="animate-fade-in-up space-y-8 px-4 py-6 md:px-8 md:py-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Stations</h1>
          <p className="mt-1 text-sm text-slate-400">
            {stations.length} stations across Blue &amp; Red lines · live train
            counts from the backend.
          </p>
        </div>
        {stationsQ.isLoading && (
          <Loader2 className="size-4 animate-spin text-slate-500" />
        )}
      </header>

      <section>
        <SectionHeader title="All Stations" right={`${stations.length} total`} />
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stations.map((s) => {
            const count = trainsByStation.get(s.id.toLowerCase()) ?? 0;
            return (
              <li key={s.id}>
                <Link
                  to="/dashboard/stations/$stationId"
                  params={{ stationId: s.id }}
                  className="group flex items-center gap-3 rounded-xl border border-white/5 bg-obsidian-900 p-4 transition-colors hover:border-accent-cyan/40"
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-md text-[11px] font-extrabold",
                      s.line === "blue"
                        ? "bg-accent-cyan/10 text-accent-cyan"
                        : "bg-danger/10 text-danger",
                    )}
                  >
                    <Building2 className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">
                      {s.name}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      {s.line === "blue" ? "Blue Line" : "Red Line"} ·{" "}
                      {count} train{count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-cyan" />
                </Link>
              </li>
            );
          })}
          {!stationsQ.isLoading && stations.length === 0 && (
            <li className="rounded-xl border border-white/5 bg-obsidian-900 p-6 text-sm text-slate-500">
              No stations available from the backend.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
