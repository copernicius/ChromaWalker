# ChromaWalk Server

Express + TypeScript backend for ChromaWalk. JWT auth, MongoDB via
Mongoose, Socket.IO for realtime team play, and Cloudflare R2 for image
storage.

The top-level [`README.md`](../README.md) covers product features and the
end-to-end setup. This file is the developer reference for working
inside `server/`.

## Stack

- **Node.js 20+**, **Express 5**, **TypeScript**
- **Mongoose 9** against MongoDB (Atlas in prod, local container in dev)
- **JWT** (custom middleware) + **google-auth-library** for OAuth verification
- **Socket.IO 4** sharing the Express HTTP server
- **multer + multer-s3** writing to Cloudflare R2 via the AWS S3 SDK
- **Google Cloud Vision** for color detection

## Layout

```
src/
├── index.ts                  # boot: Express + Mongo + Socket.IO + http.Server
├── controllers/              # request handlers grouped by feature
├── routes/                   # Express routers, one per feature
├── middleware/auth.ts        # JWT signing + Bearer-token middleware
├── models/                   # Mongoose schemas (User, Photo, TeamMission, …)
└── lib/                      # cross-cutting helpers
    ├── realtime.ts           # Socket.IO io instance + emitToTeam/emitToUser
    ├── storage.ts            # R2 client + multer engine + delete helper
    ├── response.ts           # ok() / fail() envelope, ErrCode enum
    ├── palette.ts            # 12-color canonical palette + PALETTE_IDS
    ├── missions.ts           # SOLO + DAILY mission catalog, daily picker
    ├── missionProgress.ts    # solo-completion lock, evaluateCatalogUpload
    ├── teamMissionOptions.ts # allowed target / reward / maxSize values
    ├── taskValidation.ts     # color-match validation
    ├── achievements.ts       # ACHIEVEMENTS catalog
    └── levels.ts             # 8-tier level table
```

## Response envelope

Every JSON response uses the `{ errno, errmsg, data }` shape via
`lib/response.ts`:

```ts
ok(res, data)         // → { errno: 0, errmsg: 'ok', data }
fail(res, code, msg)  // → { errno: code, errmsg: msg }
```

`errno` codes are in the `ErrCode` enum (1001 missing param, 1002 invalid
param, 1003 not found, 1004 auth failed, 1005 no result). HTTP status is
200 for business errors; 5xx is reserved for transport-level failures.

## REST endpoints

### Auth — `/api/auth`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/google` | — | Google ID token → JWT + UserProfile |
| GET | `/me` | ✓ | Current user |
| PATCH | `/me` | ✓ | `multipart/form-data`: `username`, `avatar` (file). Avatar streams to R2 |
| GET | `/me/unlocked-colors` | ✓ | Set of color ids the user has uploaded |

### Photos — `/api/photos`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/upload` | ✓ | multipart `image` + metadata; streams to R2 |
| GET | `/` | — | All photos (filter `?color=&username=`) |
| GET | `/nearby?lat=&lng=&radius=` | — | `$nearSphere` over the 2dsphere index on `geo` |
| GET | `/:id` | — | One photo |
| DELETE | `/:id` | ✓ | Owner-only; cascade-deletes likes/comments/bookmarks; R2 best-effort delete |
| GET / POST / DELETE | `/me/likes`, `/:id/like` | ✓ | Toggle pattern |
| GET / POST / DELETE | `/me/bookmarks`, `/:id/bookmark` | ✓ | Toggle pattern |
| GET | `/:photoId/comments` | — | Threaded comments (materialized path) |
| POST | `/:photoId/comments` | ✓ | Create / reply |

### Missions — `/api/missions`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/daily` | — | Today's daily mission (server-rotated) |
| GET | `/solo` | — | Full solo-mission catalog |
| GET | `/me/progress` | ✓ | `{ [missionId]: contributionCount }` for catalog missions |

### Team missions — `/api/team-missions`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/options` | — | Allowed picker values (target / reward / maxSize) |
| GET | `/me` | ✓ | Teams the caller is a member of (any status) |
| POST | `/random/join` | ✓ | Pick a random open team via `$sample` and join |
| GET | `/` | — | Open teams |
| POST | `/` | ✓ | Create (single-team rule applies) |
| GET | `/:id` | — | One team |
| POST | `/:id/join` | ✓ | Join. Auto-starts when `members × 2 > maxSize` |
| POST | `/:id/leave` | ✓ | Creator-only; **destroys** the team and its messages |
| GET | `/:id/messages` | ✓ (member) | Newest 100 messages |
| POST | `/:id/messages` | ✓ (member) | Body `{ text }`. Emits `message:new` via Socket.IO |

### Misc
- `POST /api/detect-color` — Google Vision color classification, returns `{ color }`
- `GET /api/achievements/me` — hydrated achievements
- `GET /api/levels` — level table
- `GET /api/palette` — 12-color palette

## Realtime (Socket.IO)

Wired in `lib/realtime.ts` — same HTTP server as Express, JWT auth at
handshake (`socket.handshake.auth.token`).

| Direction | Event | Notes |
|---|---|---|
| client → server | `team:join` `(teamId, ack)` | Re-validates membership against Mongo before joining the `team:<id>` room |
| client → server | `team:leave` `(teamId)` | Idempotent (rooms also auto-released on disconnect) |
| server → client | `message:new` | New chat message — emitted from `postTeamMessage` |
| server → client | `team:updated` | Full team JSON after any contribution. Emitted from `photoController.uploadPhoto` after `team.save()` |

Auto-joined rooms:
- `user:<userId>` — every connected socket joins their own room (reserved for future direct messaging / shake-match notifications)

`emitToTeam(teamId, event, payload)` and `emitToUser(userId, event,
payload)` are the only exports controllers should use — keeps the
transport swappable. **Not multi-process safe**: rooms live in process
memory. Going beyond 1 Fly machine requires a Redis adapter (~30 lines).

## Image storage (Cloudflare R2)

`lib/storage.ts` exposes:
- `r2Storage(prefix)` — multer engine that streams to `R2_BUCKET/<prefix><uuid><ext>`. Used by `routes/photos.ts` (`photos/`) and `routes/auth.ts` (`avatars/`).
- `r2PublicUrl(key)` — constructs the browser-facing URL from `R2_PUBLIC_URL`.
- `r2DeleteObject(url)` — best-effort delete keyed off the public URL stored on the document. No-ops for non-R2 URLs (Google CDN, pre-migration `/tmp/` paths).

R2 doesn't honor per-object ACLs — public access is configured at the
bucket level via the **R2.dev subdomain** (Cloudflare Dashboard → R2 →
bucket → Settings → Public access). Paste that URL into `R2_PUBLIC_URL`.

## Auth

- **Login**: `POST /api/auth/google` with a Google ID token. Server verifies via `google-auth-library`, upserts the user, returns `{ user, token }` where `token` is a 7-day JWT signed with `JWT_SECRET`.
- **Subsequent requests**: `Authorization: Bearer <jwt>`. The `auth` middleware decodes and sets `req.userId`.
- **Socket.IO**: same JWT, passed at handshake via `auth.token`.

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `PORT` | — | Defaults to 3000 (8080 in Fly via `[env]`) |
| `MONGO_URI` | ✓ | `mongodb+srv://…/chromawalk?…` for Atlas |
| `JWT_SECRET` | ✓ | Any random string ≥ 32 chars; `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | ✓ | OAuth 2.0 client id (must match the client's `VITE_GOOGLE_CLIENT_ID`) |
| `GOOGLE_VISION_KEY` | ✓ | API key for the color-detection endpoint |
| `R2_ACCESS_KEY_ID` | prod | Cloudflare R2 token id |
| `R2_SECRET_ACCESS_KEY` | prod | Cloudflare R2 token secret |
| `R2_ENDPOINT` | prod | `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | prod | Bucket name |
| `R2_PUBLIC_URL` | prod | `https://pub-<hash>.r2.dev` (or your custom domain) |
| `CLIENT_ORIGIN` | prod | Comma-separated CORS allowlist. Supports `*.example.com` for preview deploys. Unset = allow any origin (dev only) |

**R2 is optional.** `lib/storage.ts` checks all five `R2_*` vars at
boot. If any are missing, the server falls back to local-disk storage
under `<server>/tmp` (served via `app.use('/tmp', static)`) — same flow
the app shipped with originally. Useful for development to avoid
spending R2 quota. The boot log line tells you which mode is active:
`[storage] mode=R2 …` or `[storage] mode=local …`.

## Running locally

```bash
# From the repo root, the docker-compose setup is the easiest path
cd ../docker && make up

# Or directly, if Mongo is already running
cd server
npm install
cp .env.example .env  # then fill in the required vars
npm run dev           # tsx watch — auto-reload on file changes
```

`npm run dev` uses `tsx watch src/index.ts`. The local `Dockerfile.server`
in `docker/` does the same thing inside a container with `npm install`
on each `make up`.

## Build & deploy

```bash
npm run typecheck    # TypeScript only
npm run build        # tsc → dist/
npm start            # node dist/index.js (production)
fly deploy           # builds the prod Dockerfile, pushes to Fly
```

The production image is `server/Dockerfile` — multi-stage Node 20 alpine
build, runs as the unprivileged `node` user, ships only `dist/` plus
production deps. Fly app config is in `server/fly.toml`. Detailed deploy
instructions are in the top-level [README](../README.md#backend--flyio).

## Conventions

- **Errors**: business failures use `fail(res, ErrCode.*, msg)` with a human-friendly message; transport failures throw and are caught by the surrounding `try/catch` returning HTTP 500.
- **Cascading deletes** are explicit (no Mongoose middleware). When a Photo is removed, the controller also wipes its likes/comments/bookmarks. When a TeamMission is disbanded, its TeamMessages go too.
- **Denormalized fields** on Photo (`username`, `avatarUrl`) and TeamMission (`creatorUsername`) are kept in sync by the controllers that mutate the source field — see `authController.updateMe` for the photo-update fan-out.
- **Single source of truth for picker values**: `lib/teamMissionOptions.ts` defines `TEAM_MISSION_TARGET_OPTIONS` etc. Both `GET /api/team-missions/options` and `createTeamMission`'s validators read from it, so the client UI and server validation can never drift.
- **Shared mission completion logic** lives in `lib/missionProgress.ts` (`evaluateCatalogUpload`, `pinCompletedProgress`, `countCompletedSolos`) so the photo upload, mission progress endpoint, and achievements all answer the same way.

## Operational notes

- **Logs**: `fly logs` (prod) or `make logs` (dev). Mongoose connection messages appear at boot — look for `MongoDB connected`.
- **Fly secrets**: `fly secrets list` shows keys + digests, never values. `fly secrets set FOO=bar` triggers an automatic redeploy of the *current* image with the new env injected — code changes still need `fly deploy`.
- **Photos in R2**: orphans (R2 objects whose Mongo row was deleted) can be swept with an R2 lifecycle rule. The DB is the source of truth; `r2DeleteObject` is best-effort.
- **Atlas IP allowlist**: Fly machines have dynamic egress IPs. For v1, allow `0.0.0.0/0` in Atlas Network Access — the credential pair + TLS is the real defense.
