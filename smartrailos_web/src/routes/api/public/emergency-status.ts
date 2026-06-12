import { createFileRoute } from "@tanstack/react-router";

/**
 * Public endpoint reporting whether an emergency is currently active.
 * Replace this stub with real state (DB row, KV flag, incident system, etc).
 * Set EMERGENCY_ACTIVE=true in env to make the Emergency button blink.
 */
export const Route = createFileRoute("/api/public/emergency-status")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch("http://localhost:8000/api/v1/alerts/emergency");
          if (!res.ok) throw new Error("Failed to fetch emergency status");
          const data = await res.json();
          return new Response(JSON.stringify({ active: data.active }), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        } catch (e) {
          return new Response(JSON.stringify({ active: false }), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        }
      },
    },
  },
});
