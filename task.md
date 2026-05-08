# Task Assignments — ChromaWalk

Six members, one module each. Splits are feature-vertical so each owner
touches their own files end-to-end (server controller + route + model +
client page + queries) and PR conflicts stay rare.

Every file in the repo is listed below under exactly one owner, so when
the codebase ships into a fresh repo a new clone has a clean owner map
and nothing required to boot is missing.

Interfaces between modules: shared types live under client `data/` and
server `models/`. The response envelope (`server/src/lib/response.ts`)
and the client `apiCall` wrapper (`client/src/app/lib/api.ts`) are owned
by A — coordinate with A before changing their shape.

---

## A — Monorepo skeleton & shared infra (owner)

Build/deploy plumbing, base app shells, cross-cutting libs, and every
config file the project needs to install, lint, build, test, and run.

**Repo root**
- `README.md`, `task.md`, `.gitignore`
- `docker/README.md`, `docker/docker-compose.yml`

**Client — repo-level config**
- `client/package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- `client/tsconfig.json`, `vite.config.ts`, `vitest.config.ts`,
  `postcss.config.mjs`, `biome.json`
- `client/.editorconfig`, `index.html`
- `client/.env.example`, `.env`, `.env.production` (env templates;
  actual `.env` is gitignored — keep `.env.example` accurate)
- `client/localhost-key.pem`, `localhost.pem` (mkcert dev certs;
  gitignored — onboarding doc tells members to regenerate)
- `client/README.md`, `ATTRIBUTIONS.md`, `openapi.md`,
  `default_shadcn_theme.css`

**Client — base shell & shared infra**
- `src/main.tsx`, `src/vite-env.d.ts`
- `src/app/App.tsx`, `src/app/Root.tsx`, `src/app/routes.ts`
- `src/app/lib/api.ts`, `lib/queryClient.ts`, `lib/index.ts`
- `src/app/store/appStore.ts`, `store/index.ts` (file structure; B
  contributes auth slice content)
- `src/app/data/index.ts`, `data/mockData.ts` (barrel + shared
  mocks; D owns `data/colors.ts`)
- `src/app/components/Header.tsx`, `Navigation.tsx`,
  `ErrorBoundary.tsx`, `components/index.ts`
- `src/app/components/ui/` — `button.tsx`, `dialog.tsx`, `input.tsx`,
  `label.tsx`, `progress.tsx`, `tabs.tsx`, `use-mobile.ts`,
  `utils.ts`, `index.ts`
- `src/styles/fonts.css`, `index.css`, `tailwind.css`, `theme.css`
- `src/test/setup.ts` (vitest harness; owners write their own specs
  alongside their files)
- `src/app/pages/index.ts`, `queries/index.ts` (barrels — owners
  add their own entries; structural changes through A)

**Server — repo-level config**
- `server/package.json`, `package-lock.json`, `pnpm-lock.yaml`
- `server/tsconfig.json`, `Dockerfile`, `.dockerignore`, `fly.toml`
- `server/.env.example`, `.env`, `.env.production`
- `server/README.md`

**Server — base shell & shared infra**
- `src/index.ts` (Express boot, CORS, route mounting, socket.io wiring)
- `src/middleware/auth.ts`
- `src/lib/response.ts`, `lib/storage.ts` (R2 + local fallback)

**Owns the contract**: response envelope shape, error codes, JWT format,
storage abstraction, base route registration order, socket namespace,
HTTPS/dev-cert setup.

---

## B — Auth & user profile

Sign-in, JWT issuance, profile editing, "me" data flowing into the app.

**Server**
- `src/controllers/authController.ts`
- `src/routes/auth.ts`
- `src/models/User.ts`

**Client**
- `src/app/pages/Welcome.tsx`, `pages/Profile.tsx`
- `src/app/queries/auth.ts`
- Auth slice content inside `src/app/store/appStore.ts` (file owned
  by A; B writes the auth-related state/actions)
- `src/app/components/UserAvatar.tsx`

**Touchpoints**: depends on A's auth middleware; consumed by every
other module via `req.userId` and the zustand `user` slice.

---

## C — Photo upload + color detection

Capture flow, image compression, color classification, photo CRUD.

**Server**
- `src/controllers/photoController.ts`
- `src/controllers/colorController.ts`
- `src/routes/photos.ts` (also currently hosts comment/like/bookmark
  sub-routes — F owns those handlers; coordinate before extracting)
- `src/routes/detectColor.ts`
- `src/models/Photo.ts`

**Client**
- `src/app/pages/Upload/index.tsx`, `domain.ts`, `uploadReducer.ts`
- `src/app/pages/Upload/useDetectColorMutation.ts`,
  `useSelectedMission.ts`, `useUploadFlow.ts`,
  `useUploadPhotoMutation.ts`
- `src/app/pages/Upload/components/` — `ColorTestPanel.tsx`,
  `MissionPickerDialog.tsx`, `PhotoCapture.tsx`,
  `RequiredColorDisplay.tsx`, `TaskTypeSelector.tsx`,
  `UploadSuccessView.tsx`, `UploadTips.tsx`
- `src/app/lib/imageCompress.ts`
- `src/app/queries/photos.ts`
- `src/app/components/PhotoCard.tsx`, `PhotoDetail.tsx`,
  `PhotoImage.tsx`, `PhotoShareDialog.tsx`

**Touchpoints**: writes to D's mission progression on upload (calls
`evaluateCatalogUpload`); writes to E's team mission progression for
team uploads.

---

## D — Missions catalog, leveling, achievements, palette

Daily/solo missions, XP curve, palette unlocks, achievements grid.

**Server**
- `src/controllers/missionsController.ts`,
  `levelsController.ts`, `paletteController.ts`,
  `achievementsController.ts`
- `src/routes/missions.ts`, `routes/levels.ts`, `routes/palette.ts`,
  `routes/achievements.ts`
- `src/lib/missions.ts`, `lib/levels.ts`, `lib/missionProgress.ts`,
  `lib/palette.ts`, `lib/achievements.ts`, `lib/taskValidation.ts`

**Client**
- `src/app/pages/Missions.tsx`
- `src/app/components/MissionCard.tsx`, `DailyMissionCard.tsx`
- `src/app/queries/missions.ts`, `queries/levels.ts`,
  `queries/palette.ts`, `queries/achievements.ts`
- `src/app/data/colors.ts` (palette display data)

**Touchpoints**: C calls into `evaluateCatalogUpload` and
`validateContribution` during photo upload. Don't change those
signatures without telling C.

---

## E — Team missions & realtime

Multi-user team missions, shake-to-join, socket fan-out.

**Server**
- `src/controllers/teamMissionsController.ts`
- `src/routes/teamMissions.ts`
- `src/models/TeamMission.ts`, `models/TeamMessage.ts`
- `src/lib/realtime.ts`, `lib/teamMissionOptions.ts`

**Client**
- `src/app/lib/socket.ts`, `lib/shake.ts`
- `src/app/components/ShakeToJoinDialog.tsx`
- Team-mission detail UI within `pages/Missions.tsx` (coordinate with
  D on shared layout)

**Touchpoints**: C calls `emitToTeam` on team uploads. A wires the
socket.io server in `index.ts` — keep namespace/event names stable.

---

## F — Social engagement & discovery

Likes, comments, bookmarks, the home feed, galleries, the map view.

**Server**
- `src/controllers/likeController.ts`, `commentController.ts`,
  `bookmarkController.ts`
- `src/models/Like.ts`, `Comment.ts`, `Bookmark.ts`
- Comment / like / bookmark sub-routes currently registered inside
  `routes/photos.ts` (file owned by C — coordinate before extracting
  into a dedicated route file)

**Client**
- `src/app/pages/Home.tsx`, `Galleries.tsx`, `ColorGallery.tsx`,
  `MapExplore.tsx`
- `src/app/components/CommentThread.tsx`, `PhotoMap.tsx`,
  `LocationPicker.tsx`, `WaterfallGrid.tsx`, `CardStack.tsx`
- `src/app/queries/likes.ts`, `comments.ts`, `bookmarks.ts`

**Touchpoints**: reads C's `Photo` model and renders C's photo
components. Don't reach into Photo internals — go through C's queries.

---

## Working agreement

- Every PR touches one module. If you need to edit another module's
  files, ask the owner first or pair on it.
- A is the tiebreaker for changes that affect shared contracts
  (response envelope, error codes, storage, routing, auth middleware,
  socket namespace).
- Cross-module function signatures (`evaluateCatalogUpload`,
  `validateContribution`, `emitToTeam`, `r2PublicUrl`) are public
  contracts — owners may not change them unilaterally.
- Run `pnpm typecheck` in both `client/` and `server/` before pushing.
- Every checked-in file must be reachable from one of the lists above.
  If you add a new file, also add it to the corresponding section in
  this document in the same PR.
