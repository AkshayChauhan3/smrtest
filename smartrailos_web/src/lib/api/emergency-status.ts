import { createFileRoute } from "@tanstack/react-router";
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
