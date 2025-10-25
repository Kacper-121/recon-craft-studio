# Development Setup Guide

This guide covers setting up ReconCraft Backend for development without Docker Compose.

## Overview

The standalone development setup allows you to:
- Run the API and worker directly on your machine
- Get faster iteration cycles with hot reload
- Debug more easily with direct Python execution
- Use only Docker for MongoDB and Redis (not the entire stack)

## Prerequisites

1. **Python 3.11+**
   ```bash
   python --version  # Should be 3.11 or higher
   ```

2. **uv** - Fast Python package manager
   ```bash
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Windows
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

   # Or with pip
   pip install uv
   ```

3. **Docker** - For MongoDB and Redis services
   ```bash
   docker --version
   ```

## Quick Start

```bash
# 1. Install dependencies
make install

# 2. Start database services
make dev-services

# 3. Configure environment
cp .env.example .env

# 4. Run API (terminal 1)
make dev-standalone

# 5. Run worker (terminal 2)
make worker
```

## Detailed Setup

### Step 1: Install Dependencies

```bash
# Install all dependencies including dev tools
uv sync --all-extras
```

This will:
- Create a virtual environment in `.venv/`
- Install all production dependencies
- Install dev dependencies (pytest, black, isort, etc.)
- Generate/update `uv.lock` file

### Step 2: Start Services

```bash
# Start MongoDB and Redis
make dev-services
```

This creates two Docker containers:
- `reconcraft-mongo` on port 27017
- `reconcraft-redis` on port 6379

**Note**: These containers persist between restarts. To stop them:
```bash
make stop-dev-services
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Default `.env` values for local development:
```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=reconcraft

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
SECRET_KEY=dev-secret-key-change-in-production

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Docker (for tool execution)
DOCKER_MEMORY_LIMIT=512m
DOCKER_CPU_LIMIT=1.0
```

### Step 4: Run the API

```bash
# Using make
make dev-standalone

# Or directly with uv
uv run uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Step 5: Run the Worker

In a separate terminal:

```bash
# Using make
make worker

# Or directly with uv
uv run python worker.py
```

## Development Workflow

### Running Tests

```bash
# All tests
make test

# Specific test file
uv run pytest tests/test_health.py -v

# With coverage
uv run pytest --cov=app --cov-report=html
open htmlcov/index.html  # View coverage report
```

### Code Formatting

```bash
# Format code
make format

# Check formatting (without modifying)
make lint
```

### Adding Dependencies

```bash
# Add a production dependency
uv add package-name

# Add a dev dependency
uv add --dev package-name

# Update all dependencies
uv lock --upgrade
```

### Hot Reload

The API runs with `--reload` flag, so changes to Python files automatically restart the server.

**Files watched for changes:**
- `app/**/*.py`
- `.env` (requires manual restart)

### Debugging

Since you're running Python directly, you can use standard debugging tools:

**VSCode** - Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--port", "8000"],
      "jinja": true,
      "justMyCode": false
    },
    {
      "name": "Worker",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/worker.py",
      "console": "integratedTerminal"
    }
  ]
}
```

**PyCharm** - Create run configurations for:
- Script: `uvicorn`
- Parameters: `app.main:app --reload --port 8000`

## Common Tasks

### Check Services Status

```bash
# MongoDB
docker exec reconcraft-mongo mongosh --eval "db.runCommand({ ping: 1 })"

# Redis
docker exec reconcraft-redis redis-cli ping
```

### View Service Logs

```bash
# MongoDB logs
docker logs reconcraft-mongo -f

# Redis logs
docker logs reconcraft-redis -f
```

### Reset Database

```bash
# Drop all data
docker exec reconcraft-mongo mongosh reconcraft --eval "db.dropDatabase()"

# Or restart with fresh container
docker stop reconcraft-mongo
docker rm reconcraft-mongo
make dev-services
```

### Clean Environment

```bash
# Remove Python cache and build files
make clean

# Stop and remove services
docker stop reconcraft-mongo reconcraft-redis
docker rm reconcraft-mongo reconcraft-redis
```

## Comparing Development Methods

| Feature | Standalone (this guide) | Docker Compose |
|---------|-------------------------|----------------|
| Setup time | Fast | Slower |
| Hot reload | Yes | Yes |
| Debugging | Easy (native) | Harder (remote) |
| Resource usage | Low | Higher |
| Production parity | Good | Excellent |
| Tool execution | Requires Docker | Built-in |
| Ideal for | Active development | Testing/staging |

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000
kill -9 <PID>

# Or for MongoDB/Redis
lsof -i :27017
lsof -i :6379
```

### uv Command Not Found

```bash
# Ensure uv is in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Add to shell profile
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Module Import Errors

```bash
# Ensure you're in the backend directory
cd /path/to/recon-craft-studio/backend

# Reinstall dependencies
uv sync --all-extras
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
docker ps | grep reconcraft-mongo

# Restart MongoDB
docker restart reconcraft-mongo

# Check logs
docker logs reconcraft-mongo
```

### Worker Not Processing Jobs

```bash
# Check Redis connection
docker exec reconcraft-redis redis-cli ping

# Check queue length
docker exec reconcraft-redis redis-cli LLEN reconcraft_jobs

# Restart worker
# Ctrl+C in worker terminal, then run: make worker
```

## Tips & Best Practices

1. **Use make commands** - They handle environment setup automatically
2. **Keep services running** - MongoDB and Redis containers persist between dev sessions
3. **Use hot reload** - Save time by not restarting manually
4. **Run tests frequently** - `make test` before committing
5. **Format before commit** - `make format` to ensure consistent style
6. **Check logs** - Use `docker logs` to debug service issues
7. **Virtual environment** - uv manages this automatically in `.venv/`

## Next Steps

- Read [API_EXAMPLES.md](./API_EXAMPLES.md) for API usage
- See [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md) for architecture overview
- Check [README.md](./README.md) for full documentation

## Getting Help

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review logs: `docker logs reconcraft-mongo` / `docker logs reconcraft-redis`
3. Ensure all prerequisites are installed
4. Try the Docker Compose method as an alternative
