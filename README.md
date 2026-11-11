# RemoteFleet Console

Enterprise mini CI/CD deployment orchestrator & remote fleet monitoring system.

One-click multi-server deploys over SSHv2, live ANSI log streaming to Xterm.js, AES-256-GCM credential vault, and auto-rollback via `trap ERR` bash scripts.

## Stack

- **Backend:** NestJS, TypeORM, PostgreSQL, ssh2, Socket.IO
- **Frontend:** React (Vite), Tailwind CSS, Lucide, `@xterm/xterm`
- **Infra:** Docker Compose, Makefile

## Quick start (local)

```bash
cp .env.example .env
# edit MASTER_VAULT_KEY if needed: openssl rand -hex 32

# Postgres (Homebrew local or Docker)
# createdb remotefleet_db && createuser remotefleet
# or: docker compose up postgres -d

make install
make backend   # http://localhost:3001
make seed      # demo fleet servers (idempotent)
make frontend  # http://localhost:3000
make smoke     # health + auth checks
```

## Quick start (full Docker)

```bash
cp .env.example .env
make up
```

- Frontend: http://localhost:3000  
- Backend API / WS: http://localhost:3001  

## Auth

- Login UI: `/login` — demo `admin@remotefleet.test` / `ops@remotefleet.test`, password `password`
- Operator JWT via `Authorization: Bearer <token>` (stored in localStorage)
- Automation still works with `x-api-key: $API_KEY`
- `GET /api/v1/health` and `POST /api/v1/auth/login` are public

## Scheduler

Health checks chạy cron mỗi 5 phút khi `HEALTH_CHECK_CRON_ENABLED=true`.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Public health check |
| `POST` | `/api/v1/auth/login` | Login operator → JWT |
| `GET` | `/api/v1/auth/me` | Current operator |
| `GET` | `/api/v1/system/status` | Scheduler + fleet snapshot |
| `GET` | `/api/v1/servers` | List fleet servers |
| `POST` | `/api/v1/servers` | Register server + encrypt credential |
| `PATCH` | `/api/v1/servers/:id` | Update server |
| `DELETE` | `/api/v1/servers/:id` | Delete server |
| `POST` | `/api/v1/servers/health-check` | Bulk SSH CPU/RAM/Disk probe |
| `POST` | `/api/v1/servers/:id/health-check` | Single-server health probe |
| `POST` | `/api/v1/deployments` | Trigger concurrent deploy |
| `GET` | `/api/v1/deployments/:id` | Deployment detail |
| `GET` | `/api/v1/deployments/:id/targets/:targetId/logs` | Persisted target logs |

WebSocket: connect to backend, `emit('subscribe', { channel: 'deployment:{id}:{serverId}' })`, listen on `log`.

## Project layout

See `remotefleet_blueprint_master_ai_prompt.md` for the full technical blueprint (schema, deploy script, vault, runner).
