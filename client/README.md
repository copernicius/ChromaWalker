# ChromaWalk Client

React + Vite frontend for ChromaWalk. TypeScript everywhere, Tailwind 4
for styling, TanStack Query for server state, Zustand for app state, and
Socket.IO for realtime team play.

The top-level [`README.md`](../README.md) covers product features and the
end-to-end setup (deploy, env, etc.). The
[`server/README.md`](../server/README.md) is the API/backend reference.
This file is the developer reference for working inside `client/`.

## Stack

- **React 19** + **TypeScript**, **React Router 7**
- **Vite 5** bundler with SWC
- **Tailwind CSS 4** + **Radix UI** primitives (shadcn-style wrappers in `components/ui/`)
- **TanStack Query 5** for server state, **Zustand** for client state (persisted to localStorage)
- **Socket.IO client 4** for realtime team chat + live progress updates
- **Sonner** for toasts (driven globally by the query/mutation error layer)
- **Biome** for lint + format, **Vitest** for unit tests
- **MSW** scaffolding for mocked endpoints during isolated UI work

## Layout

```
src/
├── main.tsx                  # entry: mounts <App>, wires the socket auth-watcher
├── app/
│   ├── App.tsx               # GoogleOAuthProvider + QueryClientProvider + <Root>
│   ├── Root.tsx              # auth gate, header, navigation, route table
│   ├── pages/
│   │   ├── Welcome.tsx       # Google sign-in landing
│   │   ├── Home.tsx          # daily mission, recent discoveries, quick stats
│   │   ├── Galleries.tsx     # 12-color grid → ColorGallery
│   │   ├── ColorGallery.tsx  # popular / recent tabs, waterfall layout
│   │   ├── MapExplore.tsx    # photo map (Google Maps AdvancedMarkerElement)
│   │   ├── Missions.tsx      # solo, team (chat, live updates, shake-to-join, history)
│   │   ├── Profile.tsx       # user info, my photos, bookmarked, settings
│   │   └── Upload/           # multi-step upload flow + reducer + hooks
│   ├── components/           # shared visual primitives
│   │   ├── ui/               # Radix-wrapped shadcn primitives
│   │   ├── PhotoCard.tsx     # grid tile (cover / natural aspect modes)
│   │   ├── PhotoImage.tsx    # lazy <img> + morandi-tile fallback on error
│   │   ├── UserAvatar.tsx    # gradient + monogram fallback (Google CDN safe)
│   │   ├── WaterfallGrid.tsx # CSS-columns masonry
│   │   ├── DailyMissionCard.tsx, MissionCard.tsx
│   │   ├── ShakeToJoinDialog.tsx
│   │   └── …
│   ├── lib/
│   │   ├── api.ts            # apiCall envelope unwrapper, ApiError, friendlyErrorMessage
│   │   ├── queryClient.ts    # global onError → toast handlers
│   │   ├── socket.ts         # singleton Socket.IO + watchAuthForSocket
│   │   ├── imageCompress.ts  # canvas-based JPEG re-encoder (≤500 KB target)
│   │   └── shake.ts          # devicemotion + Web Audio bling
│   ├── data/                 # static catalog data (PALETTE, mock fallback)
│   ├── queries/              # TanStack Query hooks — one file per resource
│   ├── store/                # Zustand store + persistence
│   └── pages/Upload/         # uploadReducer, useUploadFlow, …
├── mocks/                    # MSW handlers (development only)
└── styles/                   # Tailwind entry, theme.css with @keyframes
```

## State management

Three layers, one shared global cache:

| Layer | Where | Use it for |
|---|---|---|
| Server state | `app/queries/*.ts` (TanStack Query) | Anything that comes from the API. Cache key conventions live next to the hook. |
| App state | `app/store/appStore.ts` (Zustand, persisted) | `user`, `token`, `isAuthenticated`. Persisted to localStorage so refresh keeps the session. |
| Local state | `useState` / `useReducer` | UI-only state (dialogs, draft text, validation flags). |

`apiCall` reads the JWT from the Zustand store (`useAppStore.getState().token`)
and attaches it as `Authorization: Bearer …`. On 401 it logs out + clears
the query cache.

## Realtime (Socket.IO)

`lib/socket.ts` keeps a singleton socket. `watchAuthForSocket()` is
called once at boot from `main.tsx` — it subscribes to the Zustand store
and rebuilds / tears down the socket whenever the token changes
(login / logout). Consumers call `getSocket()`; it returns `null` when
unauthenticated.

Two stream hooks in `app/queries/missions.ts`:

- **`useTeamMessageStream(teamId, enabled)`** — joins the `team:<id>`
  room, listens for `message:new`, patches the messages query cache
  in-place (de-duped by id).
- **`useTeamUpdatesStream(teamId, enabled, onCompleted?)`** — listens
  for `team:updated`, patches the `['team-missions','me']` and
  `['team-missions','open']` caches. Detects the `→ completed`
  transition and fires `onCompleted` once so the UI can toast +
  invalidate user/achievement queries.

Neither hook calls `team:leave` — multiple subscribers can share a
room, and rooms are auto-released when the socket disconnects.

## Image upload pipeline

```
PhotoCapture.onSelect (data URL)
        │
        ▼
handleSelectPhoto       ← Upload/index.tsx
   • fetch → blob
   • compressImage (≤500 KB JPEG)
   • blobToDataUrl
        │
        ▼
flow.actions.selectPhoto(dataUrl)   ← state holds compressed bytes
        │
        ├─→ POST /api/detect-color  (JSON, ≤700 KB after base64)
        │
        ▼
useUploadPhotoMutation
   • dataUrl → File (no re-compression — already done)
   • POST /api/photos/upload (multipart)
   • on success: invalidate photos / auth / achievements / mission-progress / team-missions
```

Compression runs once on intake so both the detect and upload requests
ship the same compressed bytes. See `lib/imageCompress.ts` for the
algorithm (iterative quality / dimension reduction).

Avatars take the same compression path inside
`useUpdateProfileMutation`.

## Errors & toasts

`lib/queryClient.ts` wires global handlers via Radix's `QueryCache` /
`MutationCache`:

- **Queries**: any failure toasts `friendlyErrorMessage(err)`.
- **Mutations**: same, but only when the caller didn't supply its own
  `onError` (avoids double-toasting since most mutations toast their own
  context-specific copy).

`friendlyErrorMessage` (in `lib/api.ts`) prefers the server's `errmsg`
when it looks human, falls back to an `errno → phrase` mapping, then
generic copy as a last resort. 401 is excluded everywhere — the auth
middleware already logs out + redirects.

## Routing & auth gate

`Root.tsx` renders the persistent header + bottom navigation, then a
`<Routes>` table. Public paths: `/`, `/welcome`, `/galleries`,
`/galleries/:colorId`, `/maps`. Anything else redirects to `/welcome`
when `isAuthenticated` is false. The bottom navigation is hidden on
`/upload` (the magic + button is the entry point).

## Color palette

`app/data/colors.ts` is the single source of truth for the 12-color
palette. Each entry has:

- `id` — `"red"`, `"blue"`, etc. The contract with the server.
- `name` — literal label (`"Red"`). Used in pickers and actionable hints.
- `fancyName` — boutique label (`"Sunset Coral"`). Used wherever flavor matters.
- `hex` — the canonical saturated value (matches the server classifier).
- `morandi` — the soft tone we *display*. Hand-tuned palette, never use raw `hex` for backgrounds.

Helpers: `getPaletteColor(id)`. `app/queries/palette.ts` mirrors this
into a server-driven query for runtime checks.

Three places hardcode morandi values for rainbow gradients (search for
`linear-gradient(135deg, #FF9BA0`) — keep them in sync if you change the
palette.

## Local development

### Against the local backend (full stack)

```bash
cd ../docker && make up
# Frontend: https://localhost:5173
# API:      http://localhost:3000 (proxied via Vite)
```

`vite.config.ts` proxies `/api`, `/socket.io` to `http://localhost:3000`.
HTTPS is enabled only when `localhost-key.pem` and `localhost.pem` are
present (mkcert):

```bash
brew install mkcert nss
mkcert -install
mkcert localhost   # creates the two PEM files (gitignored)
```

Without the PEMs, Vite falls back to HTTP.

### Against the deployed backend (UI iteration)

```bash
echo 'VITE_API_BASE_URL=https://chromawalk2.fly.dev' > .env.local
pnpm install
pnpm dev
```

`apiCall` and `getSocket` both prepend `VITE_API_BASE_URL` so requests
skip the proxy and hit Fly directly. `.env.local` is gitignored and
overrides everything else (Vite's load order:
`.env.production.local` → `.env.production` → `.env.local` → `.env`).

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | prod | Empty in local dev (Vite proxy handles it). Prod set via `client/.env.production` or Cloudflare Pages env vars |
| `VITE_GOOGLE_CLIENT_ID` | ✓ | OAuth 2.0 client id, must match server's `GOOGLE_CLIENT_ID` |
| `VITE_GOOGLE_MAPS_API_KEY` | ✓ | For the Map Explore page and the LocationPicker |

Only `VITE_*`-prefixed vars reach the bundle. They are **public** —
never put secrets there. Anything you put in `client/.env.production`
gets baked into the JS at build time.

## Available commands

| Command | Description |
|---|---|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm typecheck` | TypeScript check |
| `pnpm check` | Biome lint + format check |
| `pnpm lint` | Biome lint only |
| `pnpm format` | Biome format-write |
| `pnpm test` | Vitest |

## Build & deploy

Frontend deploys to **Cloudflare Pages**. Settings:

| Field | Value |
|---|---|
| Build command | `pnpm install --frozen-lockfile && pnpm run build` |
| Build output directory | `dist` |
| Root directory | `client` |
| Env vars | `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_MAPS_API_KEY`, `NODE_VERSION=20` |

`public/_redirects` ships an SPA fallback (`/* /index.html 200`) so
direct loads on `/missions`, `/profile`, etc. work after deploy.

Detailed deploy guide is in the top-level
[README](../README.md#frontend--cloudflare-pages).

## Conventions

- **No raw `<img>` for photos or avatars.** Use `PhotoImage` (with
  `colorId` so the failure tile picks a themed background) or
  `UserAvatar` (for any user-supplied avatar URL). Both handle
  `loading="lazy"`, `referrerPolicy="no-referrer"`, and graceful
  onError fallback.
- **No raw `<img>` morandi backgrounds either.** Always go through
  `getPaletteColor(id)?.morandi` so a palette change propagates.
- **Toasts via Sonner**, anchored top-center (configured in
  `App.tsx`). For success: `toast.success`. For server errors, often
  the global handler already does it — only add an explicit
  `onError` if you need different copy.
- **Forms validate on submit attempt**, not on first render — see
  `CreateTeamDialog` in `Missions.tsx` for the `submitAttempted`
  pattern (red highlight + helper text only after the user clicks).
- **Mutation invalidations** are explicit and grouped at the
  hook (not callsite). Browse `useUploadPhotoMutation.onSuccess` for
  the example pattern.
- **Component barrel** (`components/index.ts`) re-exports everything;
  page-level imports should pull from `'../components'` rather than
  deep-importing files.

## Testing

`pnpm test` runs Vitest. The test surface is small — most logic that
warrants tests lives in `lib/` (pure functions like `compressImage`,
`friendlyErrorMessage`) and the upload reducer (`Upload/uploadReducer.ts`).
Add tests there first when touching those areas.

## Things worth knowing

- **iOS Safari quirks** are handled in `index.html`: `viewport-fit=cover`,
  `apple-mobile-web-app-*` meta, and `-webkit-text-size-adjust: 100%`.
  If you see "looks zoomed in" again, those are the first place to check.
- **The `Upload` flow is a reducer** (`Upload/uploadReducer.ts`) deliberately
  free of React/router/query imports so it can be unit-tested. The
  React glue lives in `useUploadFlow.ts`.
- **Socket.IO rooms are in-memory on the server.** If the backend ever
  scales beyond one Fly machine, a Redis adapter is needed (see the
  comment in `server/src/lib/realtime.ts`). Until then, single instance only.
- **MSW** lives in `src/mocks/`. Currently a small subset of endpoints —
  useful for storybook-style UI iteration without the backend running.
  Most real work needs the actual server.
