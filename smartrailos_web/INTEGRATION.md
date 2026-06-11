# Backend integration

The frontend ships with mock data so it runs without an API. To wire a real
backend, set one env var:

```
VITE_API_BASE_URL=https://api.smartrail.example.com
```

When unset, hooks fall back to `src/lib/mock/data.ts`.

## Layout

```
UI ─► hooks (src/lib/api/hooks.ts) ─► apiFetch (src/lib/api/client.ts) ─► API
                                  └─► mock fixtures (when no base URL)
```

| File | Purpose |
| --- | --- |
| `src/lib/mock/data.ts` | Source of truth for types. |
| `src/lib/api/client.ts` | Fetch wrapper and `ApiError`. |
| `src/lib/api/queries.ts` | Query options, paths, refetch intervals. |
| `src/lib/api/hooks.ts` | `useTrains`, `useAlerts`, mutations, etc. |

## Endpoints

JSON in, JSON out. Field names match the TypeScript interfaces.

| Method | Path | Returns | Refetch |
| --- | --- | --- | --- |
| GET | `/trains` | `Train[]` | 5s |
| GET | `/trains/:id` | `Train` | — |
| GET | `/stations` | `Station[]` | 1h |
| GET | `/stations/current/kpi` | `KPI` | 5s |
| GET | `/alerts` | `Alert[]` | 5s |
| GET | `/recommendations` | `Recommendation[]` | 5s |
| GET | `/announcements` | `Announcement[]` | — |
| GET | `/notifications` | `Notification[]` | — |
| GET | `/crowd/forecast` | `CrowdForecastPoint[]` | 30s |
| GET | `/analytics/hourly` | `HourlyFlowPoint[]` | — |
| GET | `/analytics/weekly` | `WeeklyTrendPoint[]` | — |
| GET | `/platforms/heatmap` | `number[][]` (4×12) | 15s |
| POST | `/alerts/:id/acknowledge` | 204 | — |
| POST | `/announcements/broadcast` | `{ ok: true }` | — |

## Payload shapes

`Train`

```ts
{
  id: "BL-UP-001",
  name: "BL-UP-001 · Vastral Express",
  line: "blue" | "red",
  direction: "Vastral Gam Bound",
  originId: "bl-1",
  destinationId: "bl-14",
  currentStationId: "bl-7",
  nextStationId: "bl-8",
  arrival: "14:42",
  departure: "14:44",
  etaSeconds: 160,
  predictedBoarding: 142,
  predictedDeboarding: 88,
  status: "Approaching" | "At Station" | "Departing" | "En Route",
  coaches: [{ id, label, capacity, occupancy: 0–100 }]
}
```

`KPI`

```ts
{
  currentTrains: number,
  passengersInStation: number,
  passengersInTransit: number,
  avgOccupancy: number,        // 0–100
  activeAlerts: number,
  predictedNextHour: number,
}
```

`Alert`

```ts
{
  id: string,
  severity: "Emergency" | "Overcrowding" | "Platform Congestion"
          | "Coach Full" | "System Warning" | "Sensor Failure",
  title: string,
  description: string,
  time: "HH:MM",
  resolved: boolean,
}
```

Remaining shapes — `Recommendation`, `Announcement`, `Notification`,
`Station`, `CrowdForecastPoint`, `HourlyFlowPoint`, `WeeklyTrendPoint` —
live in `src/lib/mock/data.ts`.

## Real-time

Polling intervals are set per query in `src/lib/api/queries.ts`. For push,
expose `wss://…/live` and apply updates with
`queryClient.setQueryData` or `queryClient.invalidateQueries`.

## CORS

```
Access-Control-Allow-Origin: <frontend origin>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true   # only if using cookies
```

Reply to `OPTIONS` preflight with the same headers.

## Auth

`apiFetch` already sends `credentials: "include"`. For bearer tokens, add an
`Authorization` header inside `apiFetch`. For API keys, use `X-API-Key`.

## Local dev

```bash
echo "VITE_API_BASE_URL=http://localhost:8000" >> .env.local
npm run dev
```

Leave the env var unset to keep using mocks.

## Conventions

- Times: 24h `HH:MM`, IST.
- Occupancy: integers `0–100`.
- IDs: stable, case-sensitive strings.
