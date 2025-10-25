# Quick Reference Guide

## 🚀 Starting the Backend

```bash
# Quick start (recommended)
./scripts/quick-start.sh

# Or manually
docker-compose up -d

# Check status
docker-compose ps
```

## 🔍 Useful Commands

```bash
# View logs
docker-compose logs -f

# View API logs only
docker-compose logs -f api

# View worker logs only
docker-compose logs -f worker

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Run tests
docker-compose exec api pytest

# Access MongoDB shell
docker-compose exec mongodb mongosh reconcraft

# Access Redis CLI
docker-compose exec redis redis-cli

# Check health
curl http://localhost:8000/api/health

# Check metrics
curl http://localhost:8000/api/metrics
```

## 🔑 Authentication Flow

```bash
# 1. Create API key (one-time)
curl -X POST http://localhost:8000/api/auth/api-keys \
  -H "Content-Type: application/json" \
  -d '{"userId": "myuser", "name": "My Key"}'
# Save the returned "key" value!

# 2. Get JWT token
curl -X POST http://localhost:8000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "rcs_YOUR_API_KEY"}'

# 3. Use token
export TOKEN="your_jwt_token_here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/workflows
```

## 📝 Common Operations

### Create Workflow
```bash
curl -X POST http://localhost:8000/api/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

### Add Target
```bash
curl -X POST http://localhost:8000/api/targets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "192.168.1.100", "tags": ["test"]}'
```

### Start Run
```bash
curl -X POST http://localhost:8000/api/runs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "wf-123",
    "targets": ["192.168.1.100"],
    "authorizeTargets": true,
    "runMode": "demo"
  }'
```

### Check Run Status
```bash
curl http://localhost:8000/api/runs/run-123 \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Troubleshooting

### Service not starting
```bash
# Check logs
docker-compose logs

# Check if ports are in use
lsof -i :8000  # API port
lsof -i :27017 # MongoDB port
lsof -i :6379  # Redis port

# Restart from scratch
docker-compose down -v
docker-compose up -d
```

### Worker not processing jobs
```bash
# Check worker is running
docker-compose ps worker

# View worker logs
docker-compose logs -f worker

# Check Redis connection
docker-compose exec worker redis-cli -h redis ping

# Check queue length
docker-compose exec redis redis-cli LLEN reconcraft_jobs
```

### MongoDB connection issues
```bash
# Test connection
docker-compose exec api python -c "from pymongo import MongoClient; print(MongoClient('mongodb://mongodb:27017').server_info())"

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Can't execute Docker containers from worker
```bash
# Verify Docker socket is mounted
docker-compose exec worker ls -la /var/run/docker.sock

# Test Docker from worker
docker-compose exec worker docker ps

# Check permissions
docker-compose exec worker docker info
```

## 📊 Monitoring

```bash
# Health check
watch -n 5 'curl -s http://localhost:8000/api/health | jq'

# Metrics
watch -n 5 'curl -s http://localhost:8000/api/metrics | jq'

# Queue depth
watch -n 2 'docker-compose exec redis redis-cli LLEN reconcraft_jobs'

# Resource usage
docker stats
```

## 🔧 Development

```bash
# Standalone development (no Docker Compose)
make install           # Install dependencies with uv
make dev-services      # Start MongoDB & Redis only
make dev-standalone    # Run API locally
make worker            # Run worker locally
make stop-dev-services # Stop MongoDB & Redis

# Full Docker stack
make dev               # Start everything with Docker Compose

# Testing & Quality
make test              # Run tests with uv
make lint              # Check code style
make format            # Format code
make clean             # Clean cache
```

## 🌐 Important URLs

| Service | URL |
|---------|-----|
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/api/docs |
| ReDoc | http://localhost:8000/api/redoc |
| Health | http://localhost:8000/api/health |
| Metrics | http://localhost:8000/api/metrics |
| MongoDB | mongodb://localhost:27017 |
| Redis | redis://localhost:6379 |

## 📂 Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment configuration |
| `docker-compose.yml` | Local development setup |
| `pyproject.toml` | Python project configuration & dependencies |
| `app/main.py` | FastAPI application |
| `worker.py` | Worker entry point |
| `app/core/config.py` | Configuration settings |

## 🔐 Security Notes

**For Production:**
1. Change `SECRET_KEY` in `.env`
2. Use strong MongoDB password
3. Use strong Redis password
4. Restrict CORS origins
5. Enable HTTPS
6. Use firewall rules
7. Regular security updates

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `README.md` | Main documentation |
| `DEV_SETUP.md` | Standalone development setup |
| `API_EXAMPLES.md` | API usage examples |
| `DEPLOYMENT.md` | Deployment guides |
| `BACKEND_SUMMARY.md` | Implementation overview |
| `QUICK_REFERENCE.md` | This file |

## 🎯 Next Steps

1. **Quick Start**: See `README.md`
2. **Standalone Development**: See `DEV_SETUP.md`
3. **API Usage**: See `API_EXAMPLES.md`
4. **Deployment**: See `DEPLOYMENT.md`
5. **Understanding**: See `BACKEND_SUMMARY.md`

## 💡 Tips

- Use demo mode for testing: `"runMode": "demo"`
- Check logs frequently: `docker-compose logs -f`
- Keep .env secure and never commit it
- Use Makefile commands for common tasks
- Monitor queue depth to ensure workers are processing
- Check health endpoint before deploying

## 🆘 Getting Help

1. Check the logs: `docker-compose logs`
2. Review documentation in this folder
3. Check API docs: http://localhost:8000/api/docs
4. Open GitHub issue with logs and error details

---

**Happy Hacking! 🎉**
