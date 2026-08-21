import { useEffect, useState } from "react";
import { type Train } from "@/lib/mock/data";
import { useTrains } from "@/lib/api/hooks";

export function useLiveTrains(): Train[] {
  const trainsQuery = useTrains();
  const [trains, setTrains] = useState<Train[]>([]);

  useEffect(() => {
    if (trainsQuery.data) {
      // Filter out AT_STATION trains whose departure ETA has already elapsed —
      // these have genuinely departed and the backend will return them as IN_TRANSIT
      // on the next poll. Filtering here prevents "ghost" cards that won't leave.
      const fresh = trainsQuery.data.filter((t) => {
        if (t.status === "At Station" && (t.departureEtaSeconds ?? t.etaSeconds) <= 0) {
          return false; // already departed — remove from list
        }
        return true;
      });
      setTrains(fresh);
    }
  }, [trainsQuery.data]);

  // Tick departureEtaSeconds and arrivalEtaSeconds down by 1 every second
  useEffect(() => {
    const id = setInterval(() => {
      setTrains((prev) =>
        prev.map((t) => {
          if (t.status === "At Station" && t.departureEtaSeconds != null) {
            const next = Math.max(0, t.departureEtaSeconds - 1);
            return next === t.departureEtaSeconds ? t : { ...t, departureEtaSeconds: next, etaSeconds: next };
          }
          if (t.arrivalEtaSeconds != null) {
            const next = Math.max(0, t.arrivalEtaSeconds - 1);
            return next === t.arrivalEtaSeconds ? t : { ...t, arrivalEtaSeconds: next, etaSeconds: next };
          }
          const eta = Math.max(0, t.etaSeconds - 1);
          return eta === t.etaSeconds ? t : { ...t, etaSeconds: eta };
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return trains.length > 0 ? trains : (trainsQuery.data ?? []);
}
