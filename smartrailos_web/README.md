# SRail — Railway Operations Dashboard

A modern, real-time dashboard for railway operations built with TanStack Start, React 19, and Tailwind CSS 4.

---

## Quick Start

### Prerequisites

- **Node.js** `20+` (recommended: latest LTS)
- **npm** `10+` (comes with Node.js)

> Optional: You can use **Bun** `1.1+` as an alternative to npm.

### 1. Clone the repository

```bash
git clone https://github.com/krish-2195/SmartRail-OS.git
cd SmartRail-OS-main/smartrailos_web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |
| `npm run format` | Format code with Prettier |

---

## Optional Environment Variables

Create a `.env` file in the project root if you want to override defaults:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_REALTIME_WS_URL=wss://api.example.com/live
```

---

## Tech Stack

- **Framework:** TanStack Start (meta-framework)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui (Radix UI primitives)
- **Data Fetching:** TanStack Query
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Build Tool:** Vite 7
- **Language:** TypeScript 5.8+
