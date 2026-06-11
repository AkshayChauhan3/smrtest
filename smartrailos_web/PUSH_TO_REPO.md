# Pushing the Frontend to SmartRail-OS

This Lovable project is the **frontend** for `SmartRail-OS`. Your friend's repo
already contains the Python backend (`backend/`, `data_api/`, `generate_data.py`,
`SmartRail_AhmedabadMetro_1Year.csv`) and an empty/placeholder `smartrailos_app/`
folder. We will replace `smartrailos_app/` with this project.

---

## 1. What counts as "the frontend"

Everything in this Lovable project is frontend (TanStack Start + React + Tailwind).
Copy **all** of these into `smartrailos_app/`:

```
src/                  # all UI, routes, components, hooks, styles
public/               # static assets
index.html
package.json
package-lock.json     # (or bun.lockb if you use bun)
tsconfig.json
vite.config.ts
app.config.ts         # if present
tailwind.config.*     # if present
postcss.config.*      # if present
components.json       # shadcn config
README.md
.gitignore
```

**Do NOT copy** these — they are Lovable / editor specific:

```
.lovable/
node_modules/
dist/
.vite/
```

---

## 2. One-time setup

```bash
# 1. Download this project's code
#    Lovable → Code Editor → "Download codebase" (bottom of file tree)
#    Unzip it somewhere, e.g. ~/Downloads/smartrail-frontend

# 2. Clone your friend's repo
git clone https://github.com/<friend>/SmartRail-OS.git
cd SmartRail-OS

# 3. Make a feature branch (don't push straight to main)
git checkout -b frontend-replacement
```

---

## 3. Replace `smartrailos_app/` with this project

```bash
# Wipe the old placeholder frontend
rm -rf smartrailos_app
mkdir smartrailos_app

# Copy the Lovable frontend in (exclude node_modules / build artifacts)
rsync -a \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.vite' \
  --exclude '.lovable' \
  --exclude '.git' \
  ~/Downloads/smartrail-frontend/ smartrailos_app/
```

---

## 4. Verify it runs

```bash
cd smartrailos_app
npm install
npm run dev          # should start on http://localhost:3000
```

---

## 5. Commit and push

```bash
cd ..    # back to repo root
git add smartrailos_app
git commit -m "feat(frontend): replace placeholder with SmartRail-OS UI"
git push origin frontend-replacement
```

Then open a Pull Request on GitHub and have your friend review/merge.

---

## 6. Wiring the frontend to the Python backend (later)

When the Python `backend/` is running locally (e.g. on `http://localhost:8000`),
point the frontend at it by creating `smartrailos_app/.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000
```

The frontend already reads this variable (see `README.md` → Environment Variables).
