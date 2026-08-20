import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { Check } from "lucide-react";

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
  const [emailDigest, setEmailDigest] = useState(true);
  const [mobilePush, setMobilePush] = useState(true);
  const [voiceEscalation, setVoiceEscalation] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter((prev) => !prev);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between">
        <SectionHeader title="Settings" right="Operator workspace" />
        {savedNotice && (
          <span className="animate-fade-in inline-flex items-center gap-1.5 rounded-full bg-accent-cyan/10 px-3 py-1 text-[11px] font-semibold text-accent-cyan">
            <Check className="size-3.5" /> Preferences Saved
          </span>
        )}
      </div>

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
          <Toggle label="Email digest" on={emailDigest} onToggle={() => handleToggle(setEmailDigest)} />
          <Toggle label="Push to mobile" on={mobilePush} onToggle={() => handleToggle(setMobilePush)} />
          <Toggle label="Voice escalation" on={voiceEscalation} onToggle={() => handleToggle(setVoiceEscalation)} />
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

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs last:border-0">
      <span className="text-slate-400">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`grid h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-accent-cyan ${
          on ? "bg-accent-cyan" : "bg-white/10"
        }`}
      >
        <span
          className={`size-4 rounded-full bg-obsidian-950 transition-transform ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

