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
        const active = process.env.EMERGENCY_ACTIVE === "true";
        return new Response(JSON.stringify({ active }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
