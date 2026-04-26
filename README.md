# ChromaWalk

A color exploration app where users walk, discover, and capture colors in their world. Built with the MERN stack (MongoDB, Express, React, Node.js).

## Project Structure

```
├── client/          # React frontend (Vite + React 19)
├── server/          # Express/Node.js backend
├── docker/          # Docker development environment
├── data/            # MongoDB data volume
```

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **React Router 7** for routing
- **Zustand** for state management
- **Tailwind CSS 4** + Radix UI for styling
- **Vite** for bundling
- **MSW (Mock Service Worker)** for API mocking in development
- **Google OAuth 2.0** for authentication
- **Google Maps API** for location picking

### Backend
- **Express 5** with Node.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Google Auth Library** for OAuth token verification

## Prerequisites

- Node.js 18+
- pnpm
- Docker & Docker Compose (for full-stack development)

## Getting Started

### Frontend Only (with API mocking)

```bash
cd client
pnpm install
pnpm dev
```

The dev server starts at `https://localhost:5173`. MSW intercepts API calls and returns mock responses, so no backend is needed for frontend development.

### Full Stack (with Docker)

```bash
cd docker
make init
```

This starts all services:
- Frontend: https://localhost:5173
- Backend API: http://localhost:3000
- MongoDB: localhost:27017

## Environment Variables

Create a `client/.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Create a `server/.env` file:

```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb://localhost:27017/chromawalk
```

## API Mocking (MSW)

In development, [MSW](https://mswjs.io/) intercepts API requests at the service worker level. Mock handlers are defined in `client/src/mocks/handlers.ts`.

Currently mocked endpoints:
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/photos` - Upload photo

To add a new mock, add a handler to the `handlers` array in `client/src/mocks/handlers.ts`.

## Available Commands

### Frontend

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm check` | Biome lint + format check |
| `pnpm test` | Run tests |

### Docker

| Command | Description |
|---------|-------------|
| `make init` | Initialize project and start all services |
| `make up` | Start all services |
| `make down` | Stop all services |
| `make logs` | View logs |
| `make clean` | Remove containers, volumes, and images |

## Features

- Google OAuth 2.0 login
- Photo capture via device camera or gallery
- Color detection from photos
- Daily color challenges and missions (solo/team)
- Location tagging with Google Maps
- Color galleries and map exploration
- User profiles with levels and achievements
