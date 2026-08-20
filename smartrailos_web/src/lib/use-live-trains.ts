import { useEffect, useState } from "react";
import { type Train } from "@/lib/mock/data";
import { useTrains } from "@/lib/api/hooks";

export function useLiveTrains(): Train[] {
  const trainsQuery = useTrains();
  const [trains, setTrains] = useState<Train[]>([]);

  useEffect(() => {
    if (trainsQuery.data) {
      setTrains(trainsQuery.data);
    }
  }, [trainsQuery.data]);

  useEffect(() => {
    const id = setInterval(() => {
      setTrains((prev) =>
        prev.map((t) => {
          const eta = Math.max(0, t.etaSeconds - 1);
          return eta === t.etaSeconds ? t : { ...t, etaSeconds: eta };
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return trains.length > 0 ? trains : (trainsQuery.data ?? []);
}
