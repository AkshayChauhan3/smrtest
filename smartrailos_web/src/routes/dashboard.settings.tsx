import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings · SmartRail OS" },
      { name: "description", content: "Operator account, alerting and integration settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="Settings" right="Operator workspace" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Account">
          <Field label="Operator name" value="Operator 402" />
          <Field label="Station" value="Old High Court Interchange" />
          <Field label="Shift" value="13:00 – 21:00 IST" />
        </Card>
        <Card title="Alert Thresholds">
          <Field label="Coach occupancy warning" value="≥ 75%" />
          <Field label="Coach occupancy critical" value="≥ 90%" />
          <Field label="Platform density alert" value="≥ 80%" />
        </Card>
        <Card title="Integrations">
          <Field label="Signalling system" value="Connected · TMS v4.2" />
          <Field label="CCTV mesh" value="48 nodes online" />
          <Field label="PA system" value="Active" />
        </Card>
        <Card title="Notifications">
          <Toggle label="Email digest" on />
          <Toggle label="Push to mobile" on />
          <Toggle label="Voice escalation" />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}
function Toggle({ label, on }: { label: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className={`grid h-5 w-9 items-center rounded-full p-0.5 ${on ? "bg-accent-cyan" : "bg-white/10"}`}>
        <span className={`size-4 rounded-full bg-obsidian-950 transition-transform ${on ? "translate-x-4" : ""}`} />
      </span>
    </div>
  );
}
