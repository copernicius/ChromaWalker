# ChromaWalk

A color exploration app where users walk, discover, and capture colors in
their world. Built with the MERN stack (MongoDB, Express, React, Node.js)
plus Socket.IO for realtime team play and Cloudflare R2 for image storage.

## Project structure

```
├── client/           # React frontend (Vite + React 19)
│   ├── public/_redirects   # Cloudflare Pages SPA fallback
│   └── .env.production     # VITE_API_BASE_URL etc. (gitignored)
├── server/           # Express/Node.js backend
│   ├── Dockerfile          # production image (multi-stage)
│   └── fly.toml            # Fly.io deploy config
├── docker/           # Local-only docker-compose (dev)
```

## Tech stack

### Frontend
- **React 19** + **TypeScript**
- **React Router 7** for routing, **Zustand** for app state, **TanStack Query** for server state
- **Tailwind CSS 4** + **Radix UI** primitives, custom Morandi palette
- **Vite** bundler
- **Socket.IO client** for realtime team chat + live progress updates
- **Google OAuth 2.0** (sign-in) and **Google Maps JS API** (location picking)
- Client-side image compression (canvas, JPEG, ≤500 KB target) before upload
- Native `loading="lazy"` masonry waterfall for photo grids

### Backend
- **Express 5** + **TypeScript**, **Mongoose 9**
- **JWT** auth (custom middleware) + **Google Auth Library** for OAuth verification
- **Socket.IO** for `team:<id>` rooms (chat + live `team:updated` broadcasts)
- **Multer + multer-s3 (R2)** for direct image uploads to Cloudflare R2
- **MongoDB Atlas** in production, local Mongo in docker-compose

## Prerequisites

- **Node.js 20+**
- **pnpm** (client) and **npm** (server)
- **Docker & Docker Compose** for local full-stack dev
- **Cloudflare R2** bucket + API token for image storage
- **MongoDB** (Atlas or local via docker-compose)
- **Google Cloud** project with OAuth 2.0 client + (optionally) Vision API

## Local development

### Full stack (recommended)

```bash
cd docker
make up
```

Services:
- Frontend: <https://localhost:5173>
- Backend API: <http://localhost:3000>
- MongoDB: localhost:27017

The first `make up` runs `npm install` / `pnpm install` inside both
containers, then starts `tsx watch` (server) and `vite` (client).

### Frontend only (against the deployed backend)

```bash
cd client
pnpm install
echo "VITE_API_BASE_URL=https://chromawalk2.fly.dev" > .env.local
pnpm dev
```

Local Vite serves the UI; all API/socket calls hit the deployed Fly
backend. Useful for UI-only iteration without running Mongo locally.

## Environment variables

### `client/.env` (development)
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# Optional — leave unset to use Vite's /api proxy to localhost:3000
VITE_API_BASE_URL=
```

### `client/.env.production` (loaded by `vite build`)
```env
VITE_API_BASE_URL=https://chromawalk2.fly.dev
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### `server/.env` (development)
```env
PORT=3000
MONGO_URI=mongodb://mongodb:27017/chromawalk
JWT_SECRET=any-string-for-local-dev
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_VISION_KEY=your_vision_api_key   # for color detection

# Cloudflare R2 — required at boot; the server fails fast if missing.
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=chromawalk
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

In production these are injected via `fly secrets set` and read from
`process.env` by the same code paths.

## Deployment

### Backend → Fly.io
```bash
cd server
fly launch --no-deploy        # claims app name; uses existing fly.toml
fly secrets set MONGO_URI=... JWT_SECRET=... GOOGLE_CLIENT_ID=... \
                R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
                R2_ENDPOINT=... R2_BUCKET=... R2_PUBLIC_URL=... \
                CLIENT_ORIGIN="https://chromawalker.pages.dev,*.chromawalker.pages.dev"
fly deploy
```

The production image is built from `server/Dockerfile` (multi-stage:
Node 20 alpine → tsc build → lean runtime image, runs as `node` user).
`fly.toml` configures port 8080, scale-to-zero, HTTPS forced.

### Frontend → Cloudflare Pages
- **Build command**: `pnpm install --frozen-lockfile && pnpm run build`
- **Build output**: `dist`
- **Root directory**: `client`
- **Environment variables**: set `VITE_API_BASE_URL` (production scope)

`public/_redirects` provides the SPA fallback (`/* /index.html 200`) so
direct loads on `/missions`, `/profile`, etc. work.

### Image storage → Cloudflare R2
Photos and avatars stream straight to R2 via `multer-s3` (`server/src/lib/storage.ts`).
The bucket needs **Public Access → R2.dev subdomain enabled**, and that
URL goes into `R2_PUBLIC_URL`. Browsers fetch images directly from R2
(no proxy through the Express server).

## Available commands

### Client (`pnpm` from `client/`)
| Command | Description |
|---|---|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript check |
| `pnpm check` | Biome lint + format |
| `pnpm format` | Biome format-write |
| `pnpm test` | Vitest |

### Server (`npm` from `server/`)
| Command | Description |
|---|---|
| `npm run dev` | tsx watch (auto-restart) |
| `npm run build` | Compile TS → `dist/` |
| `npm start` | Run compiled output |
| `npm run typecheck` | TypeScript check |

### Docker (`make` from `docker/`)
| Command | Description |
|---|---|
| `make up` | Start all services (detached) |
| `make down` | Stop and remove containers |
| `make restart` | Stop and start again |
| `make logs` | Tail combined logs |
| `make ps` | List running containers |
| `make shell-server` | bash inside the server container |
| `make shell-client` | bash inside the client container |
| `make shell-db` | mongosh against the local Mongo |
| `make build` | Rebuild images without cache |
| `make clean` | Remove containers, volumes, images (destructive) |

## Features

### Photos & galleries
- Photo capture (camera or gallery), preview, and upload with caption + location
- **Client-side compression** to ≤500 KB JPEG before any request leaves the browser
- **Color detection** via Google Vision (server) — same compressed bytes feed both `/api/detect-color` and `/api/photos/upload`
- **Resilient `<img>`s**: 12-color morandi placeholders for failed loads + `loading="lazy"` masonry waterfall in galleries
- Likes, bookmarks, threaded comments

### Missions
- **Daily mission** — server-rotated by day-of-year, single shared card on Home + Missions
- **Solo missions** — fixed catalog, permanent completion lock (deletes can't unlock the reward again)
- **Team missions** — user-created, single-team rule, auto-start when more than half the seats are filled
  - Picker form constrained to backend-validated values (target ∈ {5,10,15,20}, reward ∈ {100,200,300}, max size ∈ {3,5,7})
  - Creator-only **Disband** (cascade-deletes the team and its message board)
  - **Shake to join** a random open team (3D motion sensor + bling chime)
  - **Realtime team chat** with avatars, denormalized for fast reads
  - **Live progress updates** via Socket.IO `team:updated` events — every member's UI ticks without polling
  - **History** section archives completed missions in a read-only view (chat preserved)

### Players
- Google OAuth sign-in (one-tap)
- Profile editing (username + avatar, also compressed client-side)
- Levels with point thresholds, unlocked colors, achievements

## Architectural notes

### Realtime
Socket.IO lives in `server/src/lib/realtime.ts`. JWT handshake auth (same
secret as the REST middleware), per-team rooms (`team:<id>`), per-user
rooms (`user:<id>`, reserved for future direct messaging). Rooms are
in-memory — if you scale beyond a single Fly machine, wire the Redis
adapter (~30 lines, sketch in code comments).

### Image storage
`lib/storage.ts` exposes `r2Storage(prefix)` (multer engine) and
`r2DeleteObject(url)`. R2 doesn't support per-object ACLs; public
serving is enabled at the bucket level via the R2.dev subdomain.

### Error handling
`lib/queryClient.ts` wires global `QueryCache` and `MutationCache`
`onError` handlers that toast `friendlyErrorMessage(err)`. Mutations
with their own `onError` opt out automatically.

### Testing locally without a backend
Frontend ships with **MSW** (`client/src/mocks/handlers.ts`) for a
subset of endpoints — useful for storybook-style iteration. Most real
work needs the actual backend running.
