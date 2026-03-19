# MERN Stack Project

A full-stack application built with MongoDB, Express, React, and Node.js, containerized with Docker Compose for easy development and deployment.

## Project Structure

```
├── client/          # React frontend (Vite)
├── server/          # Express/Node.js backend
├── docker/          # Build docker development env
```

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### First-time Setup

Initialize the project and start all services:

```bash
cd docker
make init
```

This will:
- Create the data directory for MongoDB
- Build and start all containers
- Access the frontend at http://localhost:5173
- Access the backend at http://localhost:3000

## Available Commands

All commands are managed via Makefile:

| Command | Description |
|---------|-------------|
| `make init` | Initialize project (create data directory and start all services) |
| `make up` | Start all services in detached mode with rebuild |
| `make down` | Stop and remove all containers |
| `make restart` | Restart all services |
| `make build` | Build all images without cache |
| `make logs` | View real-time logs from all services |
| `make ps` | View container status |
| `make clean` | Deep clean: stop containers and remove all related images and volumes |
| `make shell-server` | Enter the server container shell |
| `make shell-client` | Enter the client container shell |
| `make shell-db` | Enter the MongoDB shell (mongosh) |

## Services

### MongoDB
- **Image**: mongo:7.0
- **Port**: 27017
- **Data Volume**: ./data/db

### Server (Express/Node.js)
- **Port**: 3000
- **Working Directory**: /app/server
- **Auto-install dependencies and start with nodemon**

### Client (React/Vite)
- **Port**: 5173
- **Working Directory**: /app/client
- **Auto-install dependencies and start dev server**

## Development Workflow

1. **Start the project**: `make up`
2. **View logs**: `make logs`
3. **Enter server shell**: `make shell-server`
4. **Enter client shell**: `make shell-client`
5. **Access MongoDB**: `make shell-db`
6. **Stop services**: `make down`

## Cleanup

To completely clean up the project (remove containers, volumes, and images):

```bash
make clean
```

## Ports

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MongoDB: localhost:27017
