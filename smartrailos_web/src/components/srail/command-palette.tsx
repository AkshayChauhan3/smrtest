import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  TrainFront,
  ArrowDownToLine,
  Users,
  Sparkles,
  BarChart3,
  Bell,
  Megaphone,
  Boxes,
  Settings,
  MonitorPlay,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { TRAINS, STATIONS, ALERTS } from "@/lib/mock/data";

const PAGES = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/live-trains", label: "Live Trains", icon: TrainFront },
  { to: "/dashboard/incoming", label: "Incoming Trains", icon: ArrowDownToLine },
  { to: "/dashboard/crowd", label: "Station Crowd", icon: Users },
  { to: "/dashboard/predictions", label: "Predictions", icon: Sparkles },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/digital-twin", label: "Digital Twin", icon: Boxes },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/wall", label: "Wall Board (Control Room)", icon: MonitorPlay },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    (window as unknown as { __openPalette?: () => void }).__openPalette = () =>
      setOpen(true);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search trains, stations, alerts, pages…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Pages">
          {PAGES.map((p) => {
            const Icon = p.icon;
            return (
              <CommandItem key={p.to} value={`page ${p.label}`} onSelect={() => go(p.to)}>
                <Icon className="mr-2 size-4" />
                {p.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Trains">
          {TRAINS.map((t) => (
            <CommandItem
              key={t.id}
              value={`train ${t.id} ${t.name} ${t.direction}`}
              onSelect={() => go("/dashboard/live-trains")}
            >
              <TrainFront className="mr-2 size-4" />
              <span className="font-mono text-xs text-slate-400">{t.id}</span>
              <span className="ml-2">{t.name.replace(`${t.id} · `, "")}</span>
              <span className="ml-auto text-[10px] uppercase tracking-widest text-slate-500">
                {t.status}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Stations">
          {STATIONS.map((s) => (
            <CommandItem
              key={s.id}
              value={`station ${s.name} ${s.line}`}
              onSelect={() => go("/dashboard/crowd")}
            >
              <MapPin className="mr-2 size-4" />
              {s.name}
              <span className="ml-auto text-[10px] uppercase tracking-widest text-slate-500">
                {s.line} line
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Alerts">
          {ALERTS.map((a) => (
            <CommandItem
              key={a.id}
              value={`alert ${a.title} ${a.severity}`}
              onSelect={() => go("/dashboard/alerts")}
            >
              <AlertTriangle className="mr-2 size-4" />
              {a.title}
              <span className="ml-auto text-[10px] uppercase tracking-widest text-slate-500">
                {a.severity}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
