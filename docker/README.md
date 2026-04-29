# How to Start the App

Follow these steps in order.

## Step 1 — Install Docker Desktop

Download and install from https://www.docker.com/products/docker-desktop/

Open the Docker Desktop app and wait until it says "Docker is running."

## Step 2 — Open a terminal in this folder

```bash
cd docker
```

## Step 3 — Start everything

```bash
make init
```

Wait a few minutes the first time. It is downloading images and installing packages.

## Step 4 — Open the app

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

Done.

---

## Stopping

```bash
make down
```

## Starting again later

```bash
make up
```

## Watching logs

```bash
make logs
```

Press `Ctrl+C` to stop watching.
