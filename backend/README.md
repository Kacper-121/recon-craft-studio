# ReconCraft Backend

Backend API for ReconCraft Studio - A no-code security reconnaissance platform that allows security professionals to build and execute security workflows using a drag-and-drop interface.

## Tech Stack

- **Language**: Python 3.11+
- **Web Framework**: FastAPI
- **Database**: MongoDB (Motor async driver)
- **Queue**: Redis + RQ (Redis Queue)
- **Container Execution**: Docker SDK
- **Authentication**: JWT + API Keys
- **Logging**: Structured JSON logs (structlog)
- **Testing**: pytest

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  FastAPI    │────▶│  MongoDB    │
│   (React)   │     │     API     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Redis    │
                    │   Queue     │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ RQ Workers  │────▶│   Docker    │
                    │             │     │ Containers  │
                    └─────────────┘     └─────────────┘
```

## Features

### Core API Endpoints

#### Authentication
- `POST /api/auth/api-keys` - Create API key
- `POST /api/auth/token` - Exchange API key for JWT

#### Workflows
- `GET /api/workflows` - List all workflows
- `GET /api/workflows/{id}` - Get workflow details
- `POST /api/workflows` - Create/update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `POST /api/workflows/{id}/duplicate` - Duplicate workflow

#### Runs
- `POST /api/runs` - Start workflow execution
- `GET /api/runs` - List all runs (with filters)
- `GET /api/runs/{id}` - Get run details
- `GET /api/runs/{id}/logs` - Get paginated logs
- `POST /api/runs/{id}/actions/send-slack` - Send findings to Slack

#### Targets
- `GET /api/targets` - List authorized targets
- `POST /api/targets` - Add target
- `POST /api/targets/bulk` - Bulk import targets
- `DELETE /api/targets/{id}` - Delete target

#### Integrations
- `POST /api/integrations/slack` - Configure Slack webhook
- `GET /api/integrations/slack` - Get Slack settings
- `POST /api/integrations/discord` - Configure Discord webhook
- `GET /api/integrations/discord` - Get Discord settings

#### Health & Metrics
- `GET /api/health` - Health check
- `GET /api/metrics` - Application metrics

### Security Features

#### Sandboxed Execution
Each tool runs in an isolated Docker container with:
- Non-root user
- Memory limits (`--memory`)
- CPU limits (`--cpus`)
- Network restrictions
- Read-only filesystem (except temp volumes)
- Optional seccomp profiles

#### Authorization
- Every target must be pre-authorized
- User consent required before execution (`authorizeTargets` flag)
- Target validation against whitelist

#### Audit Logging
Every run stores:
- User ID (initiator)
- Target list
- Workflow ID
- Timestamp
- Command executed
- Status and results
- Consent flag

### Supported Tools

- **Nmap** - Network scanning
- **HTTP Probe** - HTTP service discovery
- **Gitleaks** - Secret scanning in repositories
- **Parser/Rules** - Custom rule evaluation
- **Slack Alert** - Send notifications
- **Discord Alert** - Send notifications
- **Report Export** - Generate PDF reports
- **Delay** - Add delays between steps
- **Condition** - Conditional branching

## Quick Start

### Prerequisites

**For Docker-based development:**
- Docker & Docker Compose

**For standalone development:**
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) - Fast Python package installer
- Docker (only for MongoDB & Redis services)

### Local Development (with Docker Compose)

1. **Clone the repository**
```bash
cd recon-craft-studio/backend
```

2. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start services**
```bash
docker-compose up -d
```

4. **Check services are running**
```bash
docker-compose ps
```

5. **View logs**
```bash
docker-compose logs -f
```

6. **Access the API**
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

### Local Development (Standalone - No Docker Compose)

This method runs the API and worker directly on your machine, with only MongoDB and Redis in containers.

1. **Install uv (if not already installed)**
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or with pip
pip install uv
```

2. **Install dependencies**
```bash
cd recon-craft-studio/backend
uv sync --all-extras
```

3. **Start MongoDB and Redis services**
```bash
make dev-services
# This starts MongoDB on :27017 and Redis on :6379
```

4. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your configuration
# Default values should work for local development
```

5. **Run the API**
```bash
make dev-standalone
# Or directly: uv run uvicorn app.main:app --reload --port 8000
```

6. **Run the worker (in another terminal)**
```bash
make worker
# Or directly: uv run python worker.py
```

7. **Stop services when done**
```bash
make stop-dev-services
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key settings:
- `MONGODB_URL` - MongoDB connection string
- `REDIS_HOST` / `REDIS_PORT` - Redis connection
- `SECRET_KEY` - JWT signing key (change in production!)
- `CORS_ORIGINS` - Allowed CORS origins
- `DOCKER_MEMORY_LIMIT` - Container memory limit
- `DOCKER_CPU_LIMIT` - Container CPU limit

## API Authentication

### Creating an API Key

```bash
curl -X POST http://localhost:8000/api/auth/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "name": "My API Key"
  }'
```

Response:
```json
{
  "id": "...",
  "key": "rcs_...",
  "userId": "user123",
  "name": "My API Key",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

**Important**: Save the `key` value - it's only shown once!

### Getting a JWT Token

```bash
curl -X POST http://localhost:8000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "rcs_..."}'
```

### Using the JWT Token

```bash
curl -X GET http://localhost:8000/api/workflows \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Running Tests

```bash
# Run all tests
make test

# Or with uv directly
uv run pytest

# Run with coverage
uv run pytest --cov=app --cov-report=html

# Run specific test file
uv run pytest tests/test_health.py -v
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API endpoints
│   │       ├── auth.py
│   │       ├── workflows.py
│   │       ├── runs.py
│   │       ├── targets.py
│   │       ├── integrations.py
│   │       └── health.py
│   ├── core/                # Core configuration
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── logging.py
│   │   └── security.py
│   ├── models/              # Pydantic models
│   │   ├── workflow.py
│   │   ├── run.py
│   │   ├── target.py
│   │   ├── integration.py
│   │   └── auth.py
│   ├── services/            # Business logic
│   │   ├── auth_service.py
│   │   └── run_service.py
│   ├── workers/             # Background jobs
│   │   ├── run_executor.py
│   │   └── tool_runner.py
│   └── main.py             # FastAPI app
├── tests/                  # Test suite
├── docker/                 # Dockerfiles
├── .github/workflows/      # CI/CD
├── docker-compose.yml      # Local development
├── pyproject.toml          # Python project configuration
├── worker.py              # Worker entry point
└── README.md
```

## Demo Mode

The backend supports a "demo" mode for testing without executing real tools:

```json
{
  "workflowId": "...",
  "targets": ["192.168.1.1"],
  "authorizeTargets": true,
  "runMode": "demo"
}
```

In demo mode:
- No Docker containers are launched
- Mock findings are generated
- Execution completes quickly
- Safe for frontend development

## Deployment

### Docker Compose (Simple)

```bash
# Production build
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose logs -f api worker
```

### AWS ECS / EC2

1. Build and push Docker images
```bash
docker build -f docker/Dockerfile.api -t your-registry/reconcraft-api:latest .
docker build -f docker/Dockerfile.worker -t your-registry/reconcraft-worker:latest .
docker push your-registry/reconcraft-api:latest
docker push your-registry/reconcraft-worker:latest
```

2. Set up MongoDB Atlas or managed MongoDB

3. Set up ElastiCache Redis or managed Redis

4. Deploy containers with environment variables

5. Ensure Docker socket is available for workers

### Security Checklist for Production

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Use HTTPS/TLS for all connections
- [ ] Restrict CORS origins to your frontend domain
- [ ] Set up MongoDB authentication
- [ ] Set up Redis password
- [ ] Use VPC/private networking
- [ ] Enable firewall rules
- [ ] Set up container resource limits
- [ ] Enable Docker seccomp profiles
- [ ] Review and restrict network access for tool containers
- [ ] Set up log aggregation
- [ ] Enable monitoring and alerting
- [ ] Regular security audits

## Monitoring

### Health Check

```bash
curl http://localhost:8000/api/health
```

### Metrics

```bash
curl http://localhost:8000/api/metrics
```

Metrics include:
- Total workflows
- Total runs (by status)
- Success rate
- Active API keys
- Authorized targets count

## Troubleshooting

### Worker not processing jobs

1. Check Redis connection
```bash
docker-compose logs redis
```

2. Check worker logs
```bash
docker-compose logs worker
```

3. Verify queue
```bash
docker-compose exec redis redis-cli
> LLEN reconcraft_jobs
```

### Docker container execution fails

1. Verify Docker socket is mounted
```bash
docker-compose exec worker docker ps
```

2. Check Docker network
```bash
docker network ls | grep reconcraft
```

3. Review container logs in worker output

### MongoDB connection issues

1. Check MongoDB is running
```bash
docker-compose ps mongodb
```

2. Test connection
```bash
docker-compose exec api python -c "from pymongo import MongoClient; print(MongoClient('mongodb://mongodb:27017').server_info())"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Install dependencies: `uv sync --all-extras`
4. Make your changes
5. Run tests: `make test`
6. Run linters: `make lint`
7. Format code: `make format`
8. Submit a pull request

## License

MIT

## Security Notice

**⚠️ Important**: This tool is designed for authorized security testing only. Always ensure you have explicit permission before scanning any target system. Unauthorized scanning may be illegal.

## Support

For issues and feature requests, please open an issue on GitHub.
