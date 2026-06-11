import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { ANNOUNCEMENTS } from "@/lib/mock/data";
import { Copy, Pencil, Radio, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements · SmartRail OS" },
      { name: "description", content: "AI-suggested station announcements ready to broadcast." },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="AI-Suggested Announcements" right="Auto-refreshing" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ANNOUNCEMENTS.map((a) => (
          <div key={a.id} className="rounded-xl border border-accent-cyan/15 bg-obsidian-900 p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent-cyan">
              <Sparkles className="size-3" /> AI Draft
              <span className="ml-auto font-mono text-slate-500">{a.context}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white">{a.text}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(a.text);
                  setCopiedId(a.id);
                  setTimeout(() => setCopiedId(null), 1500);
                }}
                className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10"
              >
                <Copy className="size-3" /> {copiedId === a.id ? "Copied" : "Copy"}
              </button>
              <button className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10">
                <Pencil className="size-3" /> Edit
              </button>
              <button className="ml-auto inline-flex items-center gap-1.5 rounded border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-cyan hover:bg-accent-cyan hover:text-obsidian-950">
                <Radio className="size-3" /> Broadcast
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
