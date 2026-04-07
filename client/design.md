# ChromaWalk - Design & Technical Document

## 1. Overview

ChromaWalk is a mobile-first React web app where users walk, discover, and photograph colors in the real world. Users earn points by uploading color-tagged photos, completing missions, and unlocking rare color palettes as they level up.

**Stack:** React 18 + TypeScript (strict) + Vite 6 + Tailwind CSS 4 + React Router 7

---

## 2. Architecture

### 2.1 Project Structure

```
src/
├── main.tsx                    # Entry point, mounts <App /> into DOM
├── vite-env.d.ts               # Vite client type references
├── styles/
│   ├── index.css               # CSS entry (imports fonts, tailwind, theme)
│   ├── fonts.css               # Google Fonts (Playfair Display, Inter)
│   ├── tailwind.css            # Tailwind v4 initialization + tw-animate-css
│   └── theme.css               # Design tokens, custom animations, base typography
├── test/
│   └── setup.ts                # Vitest + jest-dom setup
└── app/
    ├── App.tsx                 # ErrorBoundary > AppProvider > RouterProvider
    ├── Root.tsx                # Layout shell: <Outlet /> + conditional <Navigation />
    ├── routes.ts               # Route definitions (createBrowserRouter)
    ├── context/
    │   └── AppContext.tsx       # Global state (user, photos, missions)
    ├── services/
    │   └── photoService.ts     # Async service layer (mock-backed)
    ├── data/
    │   └── mockData.ts         # Type definitions + mock data constants
    ├── components/
    │   ├── Header.tsx           # Fixed top header with optional back button
    │   ├── Navigation.tsx       # Fixed bottom tab bar (5 items)
    │   ├── PhotoCard.tsx        # Memoized photo card with like/favorite
    │   ├── MissionCard.tsx      # Mission display with progress bar
    │   ├── CardStack.tsx        # Swipeable card stack (motion library)
    │   ├── LazyImage.tsx        # IntersectionObserver-based lazy image
    │   ├── ErrorBoundary.tsx    # React error boundary (class component)
    │   ├── figma/
    │   │   └── ImageWithFallback.tsx
    │   └── ui/                  # Radix UI primitives (shadcn-style)
    │       ├── button.tsx
    │       ├── badge.tsx
    │       ├── progress.tsx
    │       ├── tabs.tsx
    │       ├── utils.ts         # cn() — clsx + tailwind-merge
    │       └── use-mobile.ts    # Mobile detection hook
    └── pages/
        ├── Welcome.tsx          # Landing/onboarding screen
        ├── Home.tsx             # Dashboard (stats, daily challenge, recent photos)
        ├── Galleries.tsx        # Color gallery grid + map toggle
        ├── GalleriesMapView.tsx # Extracted map view (memoized)
        ├── ColorGallery.tsx     # Single color's photo feed
        ├── MapExplore.tsx       # Full map exploration page
        ├── Missions.tsx         # Solo/team mission tabs
        ├── Profile.tsx          # User profile, achievements, photo history
        └── Upload.tsx           # Photo upload flow with color selection
```

### 2.2 Rendering Pipeline

```
main.tsx
  └── <App />
        └── <ErrorBoundary>           ← catches render errors app-wide
              └── <AppProvider>       ← React Context (user, photos, missions)
                    └── <RouterProvider>
                          └── <Root>  ← layout shell
                                ├── <Outlet />       ← active page
                                └── <Navigation />   ← bottom tab bar (conditional)
```

### 2.3 Routing

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Welcome | Onboarding landing page |
| `/home` | Home | Main dashboard |
| `/galleries` | Galleries | Color gallery grid/map |
| `/gallery/:colorId` | ColorGallery | Single color photo feed |
| `/map` | MapExplore | Map exploration view |
| `/missions` | Missions | Solo and team missions |
| `/profile` | Profile | User stats and achievements |
| `/upload` | Upload | Photo upload flow |

Navigation is hidden on `/` (Welcome) and `/upload` routes.

---

## 3. State Management

### 3.1 Context API (AppContext)

Global state is managed through a single React Context providing:

**State:**
- `user: UserProfile` — level, points, stats
- `photos: Photo[]` — all photo entries
- `missions: Mission[]` — mission definitions with progress

**Actions (all wrapped in `useCallback`):**
- `likePhoto(photoId)` — increment photo likes
- `favoritePhoto(photoId)` — increment photo favorites
- `addPhoto(photo)` — prepend photo, award 10 points
- `completeMission(missionId)` — mark mission complete
- `updateMissionProgress(missionId)` — increment mission progress

### 3.2 Local Component State

Components own UI-specific state via `useState`:
- `PhotoCard` — liked/favorited toggle, local like/favorite counts
- `CardStack` — current card index, swipe direction
- `Galleries` — search query, category filter, view mode, selected photo
- `Upload` — selected color, location, image preview, upload status

### 3.3 State Strategy

| Scope | Technique | Example |
|-------|-----------|---------|
| App-wide | Context API | User profile, photo collection, missions |
| Page-level | useState | Search filters, view toggles, selections |
| Component-level | useState | Like/favorite toggles, animation state |
| Derived data | useMemo | Filtered lists, sorted arrays, computed values |

---

## 4. Service Layer

All data access goes through `services/photoService.ts`, which exposes four service objects:

```
photoService     → getPhotos(), getPhotosByColor(), getPhotosByUser(), uploadPhoto()
missionService   → getMissions(), getSoloMissions(), getTeamMissions()
userService      → getProfile(), getAchievements()
colorService     → getColors(), getRareColors(), getAllColors()
```

All methods are `async` and return typed Promises. Currently backed by mock data with simulated delays (50–300ms). Designed for drop-in replacement with real API calls.

---

## 5. Type System

### 5.1 Core Data Types

```typescript
interface Photo {
  id: string;
  imageUrl: string;
  color: string;
  location: string;
  lat: number; lng: number;
  likes: number; favorites: number; comments: number;
  username: string;
  timestamp: Date;
}

interface Mission {
  id: string;
  title: string; description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  reward: number; color: string;
  location?: string; lat?: number; lng?: number;
  progress?: number; total?: number;
  completed?: boolean; teamMission?: boolean;
}

interface UserProfile {
  username: string;
  level: number; points: number; nextLevelPoints: number;
  photosUploaded: number; missionsCompleted: number;
  avatarUrl: string;
}

interface Achievement {
  id: string;
  name: string; description: string; icon: string;
  unlocked: boolean; progress: number; total: number;
}
```

### 5.2 Color Type Hierarchy

```typescript
interface ColorInfo {
  id: string; name: string; category: string; hex: string; unlocked: boolean;
}

interface RareColorInfo extends ColorInfo {
  unlocked: false;
  requiredLevel: number;
}

type AnyColor = ColorInfo | RareColorInfo;

// Type guard — eliminates all `as any` casts
const isRareColor = (color: AnyColor): color is RareColorInfo =>
  'requiredLevel' in color;
```

### 5.3 TypeScript Configuration

- `strict: true` — enables all strict checks
- `noUnusedLocals: true` — dead code detection
- `noUnusedParameters: true` — unused parameter detection
- `noFallthroughCasesInSwitch: true` — exhaustive switch statements
- Zero `any` types enforced by both tsconfig and ESLint rule

---

## 6. Component Patterns

### 6.1 Functional Components (Arrow Functions)

All components use arrow function syntax per project rules:

```typescript
export const PhotoCard = memo(({ photo, onClick }: PhotoCardProps) => {
  // ...
});
PhotoCard.displayName = 'PhotoCard';
```

### 6.2 Memoization Strategy

| Technique | Usage | Purpose |
|-----------|-------|---------|
| `React.memo()` | PhotoCard, GalleriesMapView | Prevent re-render on parent state change |
| `useMemo` | 21 occurrences across 5 pages | Cache derived data (filtered/sorted lists) |
| `useCallback` | 15 occurrences across 5 components | Stable function references for child props |

### 6.3 Error Boundary

`ErrorBoundary` is the only class component (required by React's error boundary API). It wraps the entire app in `App.tsx` and provides:
- `getDerivedStateFromError` — captures error state
- `componentDidCatch` — logs error + info to console
- Reset button — clears error state and re-renders children
- Custom fallback prop — allows per-boundary overrides

### 6.4 Lazy Image Loading

`LazyImage` uses `IntersectionObserver` with a 200px root margin:
1. Renders a placeholder `<div>` with pulse animation
2. Observes intersection, sets `isInView = true` when visible
3. Loads `<img>` with `loading="lazy"` and opacity transition
4. Shows error state on load failure
5. Disconnects observer on unmount (cleanup in `useEffect`)

### 6.5 Props Typing

Every component exports its props interface:

```typescript
export interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
}
```

Consumers can import types: `import type { PhotoCardProps } from '../components'`

---

## 7. Styling

### 7.1 Design Tokens (CSS Custom Properties)

Defined in `theme.css` using oklch color space:

| Token | Light | Purpose |
|-------|-------|---------|
| `--background` | #F5F1ED | Page background (warm off-white) |
| `--foreground` | #2D2520 | Primary text (dark brown) |
| `--primary` | oklch(...) | Brand primary |
| `--accent` | oklch(...) | Accent highlights |
| `--muted` | oklch(...) | Muted backgrounds |
| `--destructive` | oklch(...) | Error/danger states |
| `--radius` | 1rem | Default border radius |

Dark mode overrides all tokens via `@custom-variant dark`.

### 7.2 Typography

| Element | Font | Weight |
|---------|------|--------|
| Brand serif | Playfair Display | 400, 600 (italic) |
| Body/UI | Inter | 300–700 |
| h1 | 2rem | 600 |
| h2 | 1.5rem | 600 |
| h3 | 1.125rem | 600 |

### 7.3 Custom Animations

| Animation | Duration | Usage |
|-----------|----------|-------|
| `bounce-slow` | 3s infinite | Map markers |
| `slide-up` | 0.3s ease-out | Card/section entrances |
| `fade-in` | 0.5s ease-out | Header fade-ins |
| `scale-in` | 0.3s ease-out | Grid item appearances |

Additionally, `motion` library powers the CardStack swipe animations with spring physics (stiffness: 300, damping: 30).

### 7.4 Tailwind v4 Setup

```css
/* tailwind.css */
@import 'tailwindcss' source(none);
@source '../**/*.{js,ts,jsx,tsx}';
@import 'tw-animate-css';
```

Utility function for conditional classes:
```typescript
// ui/utils.ts
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

---

## 8. Barrel Exports

Every feature directory has an `index.ts` barrel file:

| Directory | Exports |
|-----------|---------|
| `components/` | Header, Navigation, PhotoCard, MissionCard, CardStack, LazyImage, ErrorBoundary, ImageWithFallback + all prop types |
| `components/ui/` | Button, Badge, Progress, Tabs (+ variants), cn, useIsMobile |
| `pages/` | All 9 page components |
| `data/` | All mock constants + all type definitions + isRareColor guard |

---

## 9. Testing

### 9.1 Setup

- **Runner:** Vitest 3.2 with jsdom environment
- **Libraries:** @testing-library/react, @testing-library/user-event, @testing-library/jest-dom
- **Config:** Global test APIs enabled (no explicit vitest imports needed)

### 9.2 Test Coverage

| Test File | Tests | What's Covered |
|-----------|-------|----------------|
| `ErrorBoundary.test.tsx` | 4 | Renders children, catches errors, shows fallback, recovery via "Try Again" |
| `photoService.test.ts` | 9 | All service methods: getPhotos, filter by color/user, upload, missions (solo/team), user profile, colors (rainbow/rare/all) |
| **Total** | **13** | |

### 9.3 Scripts

```bash
npm run test        # Single run
npm run test:watch  # Watch mode
```

---

## 10. Code Quality Tooling

### 10.1 ESLint

Flat config (`eslint.config.js`) with:
- `typescript-eslint/strict` — strict TS rules
- `react-hooks/recommended` — hooks rules enforcement
- `react-refresh` — fast refresh compatibility warnings
- `no-explicit-any: error` — zero tolerance for `any`
- `no-unused-vars` — with `_` prefix exception for intentional skips

### 10.2 Prettier

- Single quotes, trailing commas, 100-char width
- `prettier-plugin-tailwindcss` — auto-sorts Tailwind utility classes

### 10.3 EditorConfig

Ensures consistent formatting across editors: 2-space indent, LF endings, UTF-8, trim trailing whitespace.

### 10.4 Scripts

```bash
npm run lint        # Check lint errors
npm run lint:fix    # Auto-fix lint errors
npm run format      # Format all source files
npm run format:check # Check formatting (CI-friendly)
```

---

## 11. Build & Development

### 11.1 Development Server

```bash
npm run dev         # Starts Vite at http://localhost:5173
```

Hot module replacement enabled via `@vitejs/plugin-react`.

### 11.2 Production Build

```bash
npm run build       # Output to dist/
```

Current build output:
- `index.html` — 0.45 KB
- `index-*.css` — 48.9 KB (8.9 KB gzip)
- `index-*.js` — 345.7 KB (105.3 KB gzip)

Build time: ~1s.

### 11.3 Path Aliases

`@/` resolves to `src/` across Vite, TypeScript, and Vitest configs:
```typescript
import { cn } from '@/app/components/ui/utils';
```

---

## 12. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Tailwind v4 + CSS variables | Design tokens in CSS, utility-first styling, no runtime CSS-in-JS overhead |
| React Router v7 (browser) | File-based routing not needed; explicit route config is clearer for this app size |
| Context API over Redux/Zustand | App state is simple (user, photos, missions); no middleware or devtools needed |
| Service layer with mock delays | Async interface matches future API integration; mock delays simulate real latency |
| `motion` over `framer-motion` | Same library, lighter import name; used only for CardStack swipe gestures |
| Class component for ErrorBoundary | React has no hooks-based error boundary API; this is the only class component |
| IntersectionObserver over `loading="lazy"` | Better control over placeholder skeletons, error states, and load transitions |
| `memo()` on PhotoCard/GalleriesMapView | These render in lists/grids; parent state changes (search, filters) shouldn't re-render every card |
| Radix UI primitives for ui/ | Accessible, unstyled headless components; styled with Tailwind via CVA |
| Type guard (`isRareColor`) | Eliminates `as any` casts; discriminated union pattern for color types |
