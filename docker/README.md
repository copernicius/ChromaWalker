# Local development with Docker

Docker Compose spins up the full ChromaWalk stack — MongoDB, the Express
backend, and the Vite frontend — for local development. Production
deploys do **not** use these files (server runs on Fly.io, client on
Cloudflare Pages); see the top-level [`README.md`](../README.md) for
that path.

## What you get

`docker-compose.yml` defines three services on a shared bridge network:

| Service | Container | Port | Notes |
|---|---|---|---|
| `mongodb` | `mern-mongodb` | `27017` | Mongo 7. Data persists to `./data/db` (gitignored). |
| `server` | `mern-server` | `3000` | Node 20 + tsx watch. Mounts `../server` so edits hot-reload. |
| `client` | `mern-client` | `5173` | Node 20 + Vite dev server. Mounts `../client` so edits hot-reload. |

Both Node containers re-run their package install on every `up` —
slightly slower boot but it means dependency changes never need a
manual rebuild.

## Prerequisites

| Tool | Why |
|---|---|
| **Docker Desktop** ≥ 4.x | Runs the containers. <https://www.docker.com/products/docker-desktop/> |
| **mkcert** *(optional)* | HTTPS for the dev server. Skip → Vite serves over HTTP. |
| `make` | Convenience wrapper around `docker compose`. Pre-installed on macOS / most Linux. |

## First-time setup (clean clone)

### 1. Install Docker Desktop and start it
Open it and wait until the whale icon shows "Docker is running."

### 2. Create the environment files
Both Node services read `.env` from their bind-mounted folder.

**`server/.env`** — minimal local-dev set:

```env
PORT=3000
MONGO_URI=mongodb://mongodb:27017/chromawalk
JWT_SECRET=any-random-string-for-local-dev
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_VISION_KEY=your_vision_api_key

# Cloudflare R2 — required at boot. Use a personal R2 bucket for dev,
# or borrow the production values temporarily (just don't commit them).
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=chromawalk-dev
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

`MONGO_URI` uses `mongodb` as the hostname — that's the Mongo container
name on the docker network. From your host machine you'd use
`localhost`, but inside the server container the service name resolves.

**`client/.env`**:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# Leave VITE_API_BASE_URL unset so Vite proxies /api → the local server.
```

### 3. *(Optional)* Generate HTTPS certificates for the dev server

Without this Vite serves over plain HTTP, which is fine for most work
but breaks Google Sign-In's same-origin checks.

```bash
brew install mkcert nss
mkcert -install                 # one-time, installs the root CA
cd ../client && mkcert localhost
```

Creates `localhost-key.pem` and `localhost.pem` in `client/`. Both are
gitignored. `vite.config.ts` auto-detects them at boot.

### 4. Start the stack

```bash
cd docker
make init
```

`make init` runs three things in order:
1. `mkdir -p ../data/db` — Mongo's persistent data directory.
2. `docker compose up -d --build` — builds the images, starts all three services in the background.
3. Prints the URLs.

The first run takes 2–5 minutes (image downloads + `npm install` /
`pnpm install` inside both Node containers). Subsequent boots are
~30 seconds.

### 5. Open the app

- **Frontend**: <https://localhost:5173> (or `http://` if you skipped step 3)
- **Backend health**: <http://localhost:3000/> → returns `ChromaWalk API is running`
- **MongoDB shell**: `make shell-db`

That's it.

## Day-to-day operations

```bash
make up         # Start everything (also rebuilds if anything changed)
make down       # Stop and remove containers (data persists)
make restart    # down + up
make logs       # Tail combined logs from all services (Ctrl+C to detach)
make ps         # Running container status
```

## Inspecting / debugging

```bash
make shell-server     # bash inside the server container
make shell-client     # bash inside the client container
make shell-db         # mongosh against the local Mongo
docker logs mern-server --tail 50    # one-shot log dump
```

Inside `mongosh`:
```js
use chromawalk
db.users.countDocuments()
db.teammissions.find({}, { title: 1, status: 1, members: 1 }).pretty()
```

## Build process (what's actually happening)

Two Dockerfiles in this directory describe the dev images:

- **`Dockerfile.server`** — Ubuntu 20.04 base, Node 20.x via NodeSource, plus dev tools. The container's `CMD` is just `tail -f /dev/null` because `docker-compose.yml` overrides it with `sh -c "npm install && npm run dev"`. This pattern lets us re-run `npm install` on every container start so dependency changes "just work" without a Docker rebuild.
- **`Dockerfile.client`** — same shape. Compose overrides `CMD` with `pnpm install && pnpm run dev`.

Bind mounts make this work:
- `../server:/app/server` — the host's source tree is the container's working dir.
- `/app/server/node_modules` — anonymous volume that masks the host's `node_modules`, so the container's install (Linux binaries) doesn't get overwritten by the host's (macOS binaries).

Same pattern for the client.

> **These dev images are NOT what production runs.** Production images
> are `server/Dockerfile` (multi-stage, lean, `node dist/index.js`) and
> Cloudflare Pages' build pipeline. See the top-level README for that.

## Resetting / cleanup

```bash
make clean
```

Removes containers, named volumes, and the locally-built images.
**Destructive** — wipes your local Mongo data. Use when something is
deeply broken and you want to start fresh.

For a softer reset that keeps data:

```bash
make down
docker compose up -d --build --force-recreate
```

## Troubleshooting

**`make init` fails with "port already allocated"**
Something else is using 3000, 5173, or 27017 on your host. Stop it
(`lsof -i :3000`) or change the host port in `docker-compose.yml`.

**Server boots then immediately exits with `Missing required env: R2_*`**
You skipped step 2 or omitted the R2 vars. The server fails fast at
boot if any R2 env is missing. See `server/lib/storage.ts` for the
list. Re-create `server/.env` and `make restart`.

**Frontend can't reach the backend**
Vite proxies `/api` and `/socket.io` to `http://localhost:3000`. If
you're inside the client container, that resolves to the container
itself — but Vite runs *outside* the user's request path, so this
isn't a problem. Just confirm the server container is up
(`make ps`) and that you didn't set `VITE_API_BASE_URL` in
`client/.env`.

**MongoDB connection refused on first boot**
The server can race the Mongo container. `depends_on` only waits for
the container to start, not for Mongo to be ready to accept
connections. Usually self-resolves within 5–10 seconds; if not,
`make restart`.

**Hot reload not picking up changes**
On macOS, file events from bind mounts can lag for some editors.
Try `:cached` or `:delegated` mount flags in `docker-compose.yml`
(the client one already uses `:cached`). Or just `make restart`.

## Where to go next

- Backend / API reference → [`server/README.md`](../server/README.md)
- Frontend conventions → [`client/README.md`](../client/README.md)
- End-to-end product features and production deploy → [`README.md`](../README.md) at the repo root
