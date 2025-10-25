# ReconCraft Studio - Quick Start Guide

Get up and running with ReconCraft Studio in minutes!

## Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Python** 3.9+ (for backend)

## 🚀 Quick Start (5 Minutes)

### 1. Start the Backend

```bash
# Navigate to backend directory
cd backend

# Start all services (MongoDB, Redis, API, Worker)
docker-compose up -d

# Wait for services to be ready (~30 seconds)
docker-compose logs -f api
# Look for: "Application startup complete"
```

### 2. Create an API Key

```bash
# Create your first API key
curl -X POST http://localhost:8000/api/auth/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name": "My First Key"}'
```

**Response:**
```json
{
  "id": "key-123",
  "name": "My First Key",
  "key": "rcs_live_abcdef123456...",
  "keyPrefix": "rcs_live_abcd",
  "createdAt": "2025-01-25T10:00:00Z"
}
```

**⚠️ Important:** Save the `key` value - it's only shown once!

### 3. Configure Frontend

```bash
# Navigate to frontend (project root)
cd ..

# Copy environment template
cp .env.example .env

# Edit .env if needed (defaults should work)
# VITE_API_BASE_URL=http://localhost:8000/api
```

### 4. Install Dependencies

```bash
# Install frontend dependencies
npm install
```

### 5. Start Frontend

```bash
# Start development server
npm run dev
```

**Frontend will be available at:** `http://localhost:5173`

### 6. First Login

1. Open `http://localhost:5173` in your browser
2. When prompted, enter your API key: `rcs_live_abcdef123456...`
3. Click "Login" - you'll get a JWT token automatically

---

## 📋 What You Can Do Now

### Create Your First Workflow

1. **Navigate to Builder** (`/builder`)
2. **Drag & drop nodes** from the left palette:
   - Start node
   - Nmap scanner
   - HTTP probe
   - Report generator
3. **Connect nodes** by dragging from one to another
4. **Configure nodes** by clicking them (right panel)
5. **Name your workflow** at the top
6. **Check "Authorize Targets"**
7. **Click Save**

### Add Authorized Targets

1. **Navigate to Targets** (`/targets`)
2. **Click "Add Target"**
3. **Enter target**: `demo.testfire.net` or your authorized target
4. **Add tags** (optional): `demo, web`
5. **Click "Add Target"**

### Run Your First Scan

1. **Go back to Builder** (`/builder?id=your-workflow-id`)
2. **Click "Run"** button
3. **Watch the console** at the bottom for real-time logs
4. **Monitor progress** - status updates every 2 seconds

### View Results

1. **Navigate to Runs** (`/runs`)
2. **Click on any run** to see:
   - Execution steps
   - Logs
   - Findings
   - Summary
3. **Export or share** results via Slack/Discord

---

## 🧪 Demo Mode vs Live Mode

### Demo Mode (Default)
- **Safe testing** - no actual scanning
- **Mock data** - realistic fake results
- **Fast execution** - completes in seconds
- **No authorization needed** for testing

### Live Mode (Production)
- **Real scanning** - actual tool execution
- **Docker containers** - sandboxed environment
- **Requires authorization** - targets must be pre-authorized
- **Longer execution** - depends on scan complexity

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# Application
APP_NAME=ReconCraft Backend
DEBUG=false

# Database
MONGODB_URL=mongodb://mongodb:27017
REDIS_HOST=redis

# Security
SECRET_KEY=your-secret-key-change-this-in-production

# CORS
CORS_ORIGINS=http://localhost:5173

# Docker
DOCKER_MEMORY_LIMIT=512m
DOCKER_CPU_LIMIT=1.0
```

### Frontend Configuration

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_DEBUG=false
```

---

## 📊 Verify Everything Works

### 1. Check Backend Health

```bash
curl http://localhost:8000/api/health
```

**Expected:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-01-25T10:00:00Z"
}
```

### 2. Check API Metrics

```bash
curl http://localhost:8000/api/metrics
```

### 3. List Workflows

```bash
curl http://localhost:8000/api/workflows \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. View Backend Logs

```bash
# API logs
docker-compose logs -f api

# Worker logs
docker-compose logs -f worker

# All services
docker-compose logs -f
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check if ports are available
lsof -i :8000  # API
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis

# Stop and restart
cd backend
docker-compose down
docker-compose up -d --build
```

### Frontend Can't Connect

1. Check backend is running: `curl http://localhost:8000/api/health`
2. Check CORS settings in `backend/.env`
3. Clear browser cache and localStorage
4. Check browser console for errors

### Authentication Issues

```bash
# Generate new API key
curl -X POST http://localhost:8000/api/auth/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name": "New Key"}'

# Clear old token from localStorage
localStorage.removeItem('auth_token')
```

### Docker Issues

```bash
# Clean everything and restart
docker-compose down -v
docker-compose up -d --build

# Check container status
docker-compose ps

# View specific container logs
docker-compose logs worker
```

---

## 📚 Next Steps

### Learn More

- **API Integration Guide**: `FRONTEND_API_INTEGRATION.md`
- **Backend Details**: `BACKEND_SUMMARY.md`
- **API Examples**: `backend/API_EXAMPLES.md`
- **Deployment Guide**: `backend/DEPLOYMENT.md`

### Add Features

1. **Configure Integrations** (`/settings`)
   - Slack webhook
   - Discord webhook

2. **Import Targets** (`/targets`)
   - Bulk import from file
   - Tag organization

3. **Create Templates**
   - Save common workflows
   - Share with team

4. **Schedule Scans**
   - Recurring workflows
   - Automated reports

---

## 🚀 Production Deployment

### Quick EC2 Deployment

```bash
# On your EC2 instance
git clone <your-repo>
cd recon-craft-studio

# Backend
cd backend
docker-compose up -d

# Frontend (build for production)
cd ..
npm run build
# Serve dist/ with nginx or similar
```

### Environment Variables for Production

**Backend `.env`:**
```env
DEBUG=false
SECRET_KEY=<strong-random-key>
CORS_ORIGINS=https://your-domain.com
MONGODB_URL=mongodb://your-mongodb-atlas-url
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

---

## 🔐 Security Checklist

- [ ] Change default `SECRET_KEY` in backend `.env`
- [ ] Use strong API keys (generated by backend)
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Only scan authorized targets
- [ ] Regularly rotate API keys
- [ ] Monitor audit logs
- [ ] Keep dependencies updated

---

## 📞 Getting Help

### Documentation
- Frontend API Guide: `FRONTEND_API_INTEGRATION.md`
- Backend README: `backend/README.md`
- API Examples: `backend/API_EXAMPLES.md`

### Common Commands

```bash
# Backend
cd backend
docker-compose up -d      # Start
docker-compose down       # Stop
docker-compose logs -f    # View logs
docker-compose ps         # Status

# Frontend
npm run dev              # Development
npm run build            # Production build
npm run preview          # Preview build

# Health Checks
curl http://localhost:8000/api/health
curl http://localhost:5173  # Should load frontend
```

---

## ✅ You're Ready!

You now have a fully functional security reconnaissance platform with:

- ✅ Visual workflow builder
- ✅ Real-time execution monitoring
- ✅ Automated scanning tools
- ✅ Finding management
- ✅ Integration with Slack/Discord
- ✅ Production-ready architecture

**Happy scanning! 🔍**

---

**Last Updated**: 2025-01-25
