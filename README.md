# ReconCraft Studio

> **Visual Workflow Builder for Security Reconnaissance**

A modern, production-ready platform for orchestrating security reconnaissance workflows with real-time execution monitoring and automated scanning tools.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-green.svg)

---

## 🚀 Quick Start

Get up and running in 5 minutes:

```bash
# 1. Start backend services
cd backend && docker-compose up -d

# 2. Install frontend dependencies
cd .. && npm install

# 3. Configure environment
cp .env.example .env

# 4. Start development server
npm run dev
```

**📖 See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions**

---

## ✨ Features

### Visual Workflow Builder
- **Drag & drop interface** - Create complex workflows visually
- **Node palette** - Pre-built security tools ready to use
- **Real-time preview** - See your workflow structure instantly
- **Node configuration** - Customize each tool's parameters

### Security Tools
- **Nmap** - Network scanning and port discovery
- **Gitleaks** - Secret detection in repositories
- **HTTP Probe** - Service discovery and enumeration
- **Custom Parsers** - Rule-based output processing
- **Report Generation** - Automated PDF reports

### Execution Engine
- **Sandboxed execution** - Docker containers for isolation
- **Real-time monitoring** - Live log streaming and status updates
- **Queue system** - Redis-backed job processing
- **Parallel execution** - Efficient workflow processing

### Integrations
- **Slack** - Automated alerts and notifications
- **Discord** - Team collaboration and reporting
- **Webhook support** - Custom integrations

### Security & Compliance
- **Target authorization** - Whitelist-based access control
- **Audit logging** - Complete activity tracking
- **JWT authentication** - Secure API access
- **API key management** - Fine-grained access control

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Builder    │  │    Runs      │  │   Targets    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│              RTK Query API Integration                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  REST API    │  │   Workers    │  │  Auth/Auth   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Infrastructure                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   MongoDB    │  │    Redis     │  │    Docker    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
recon-craft-studio/
├── src/                           # Frontend source code
│   ├── api/
│   │   └── reconCraftApi.ts      # RTK Query API service
│   ├── components/                # React components
│   ├── pages/                     # Page components
│   ├── store/                     # Redux store
│   └── types/                     # TypeScript types
│
├── backend/                       # Backend service
│   ├── app/
│   │   ├── api/routes/           # API endpoints
│   │   ├── core/                 # Core functionality
│   │   ├── models/               # Data models
│   │   ├── services/             # Business logic
│   │   └── workers/              # Background jobs
│   ├── docker-compose.yml        # Local development
│   └── requirements.txt          # Python dependencies
│
├── .env                          # Frontend environment config
├── QUICK_START.md               # Quick setup guide
├── FRONTEND_API_INTEGRATION.md  # API integration docs
├── API_INTEGRATION_SUMMARY.md   # Integration overview
└── BACKEND_SUMMARY.md           # Backend architecture
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | Get started in 5 minutes |
| **[FRONTEND_API_INTEGRATION.md](./FRONTEND_API_INTEGRATION.md)** | Complete API integration guide |
| **[API_INTEGRATION_SUMMARY.md](./API_INTEGRATION_SUMMARY.md)** | Integration overview and features |
| **[BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md)** | Backend architecture details |
| **[backend/README.md](./backend/README.md)** | Backend setup and deployment |
| **[backend/API_EXAMPLES.md](./backend/API_EXAMPLES.md)** | Backend API usage examples |
| **[backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md)** | Production deployment guide |

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **RTK Query** - API data fetching
- **React Flow** - Workflow visualization
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - Database
- **Redis** - Queue and caching
- **Docker** - Container runtime
- **RQ** - Background job processing
- **Pydantic** - Data validation

---

## 🔐 Security Features

- ✅ **API Key Authentication** - Secure key generation
- ✅ **JWT Tokens** - Stateless authentication
- ✅ **Target Authorization** - Whitelist enforcement
- ✅ **Sandboxed Execution** - Docker isolation
- ✅ **Audit Logging** - Complete activity tracking
- ✅ **CORS Protection** - Configurable origins
- ✅ **Rate Limiting** - API throttling
- ✅ **Input Validation** - Pydantic models

---

## 🚦 API Integration

The frontend uses **RTK Query** for efficient API communication:

### Features
- **Automatic Caching** - Smart data reuse
- **Real-time Polling** - Live status updates
- **Type Safety** - Full TypeScript support
- **Error Handling** - Consistent error patterns
- **Loading States** - Built-in UI feedback

### Example Usage

```typescript
import { useGetWorkflowsQuery, useStartRunMutation } from '@/api/reconCraftApi';

function WorkflowList() {
  // Automatic fetching and caching
  const { data: workflows, isLoading } = useGetWorkflowsQuery();

  // Mutations with optimistic updates
  const [startRun] = useStartRunMutation();

  const handleRun = async (workflowId: string) => {
    await startRun({
      workflowId,
      targets: ['demo.example.com'],
      runMode: 'demo',
      authorizeTargets: true
    });
  };

  return <WorkflowGrid workflows={workflows} onRun={handleRun} />;
}
```

**📖 See [FRONTEND_API_INTEGRATION.md](./FRONTEND_API_INTEGRATION.md) for complete examples**

---

## 🎯 Use Cases

### Security Teams
- **Reconnaissance Automation** - Schedule regular scans
- **Asset Discovery** - Find exposed services
- **Vulnerability Assessment** - Identify security issues
- **Compliance Checking** - Verify security posture

### DevOps Teams
- **CI/CD Integration** - Security in pipelines
- **Infrastructure Monitoring** - Continuous scanning
- **Change Validation** - Pre-deployment checks
- **Incident Response** - Rapid assessment

### Bug Bounty Hunters
- **Target Enumeration** - Comprehensive discovery
- **Workflow Templates** - Reusable methodologies
- **Finding Management** - Track discoveries
- **Report Generation** - Professional reporting

---

## 🧪 Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Python 3.9+ (for backend)

### Local Development

```bash
# Frontend
npm install
npm run dev           # Start dev server
npm run build         # Production build
npm run preview       # Preview build

# Backend
cd backend
docker-compose up -d  # Start services
docker-compose logs   # View logs
docker-compose down   # Stop services
```

### Environment Configuration

**Frontend (`.env`):**
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Backend (`backend/.env`):**
```env
APP_NAME=ReconCraft Backend
DEBUG=false
MONGODB_URL=mongodb://mongodb:27017
REDIS_HOST=redis
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:5173
```

---

## 🌐 Production Deployment

### Quick EC2 Deployment

```bash
# Backend
cd backend
docker-compose -f docker-compose.prod.yml up -d

# Frontend
npm run build
# Serve dist/ with nginx or CDN
```

### AWS ECS Deployment

```bash
cd backend
# Follow DEPLOYMENT.md for complete setup
aws ecs create-cluster --cluster-name reconcraft
# ... (see DEPLOYMENT.md)
```

**📖 See [backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md) for complete deployment guide**

---

## 📊 Monitoring & Metrics

### Health Checks

```bash
# Backend health
curl http://localhost:8000/api/health

# Application metrics
curl http://localhost:8000/api/metrics
```

### Metrics Available
- Total workflows
- Total runs (by status)
- Success rate
- Active API keys
- Authorized targets count
- Queue depth

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow existing code style
- Add comments for complex logic

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **FastAPI** - Modern Python web framework
- **React Flow** - Workflow visualization
- **shadcn/ui** - Beautiful components
- **Redux Toolkit** - State management
- **Docker** - Container platform

---

## 📞 Support

- **Documentation**: See docs in the repository
- **Issues**: Open an issue on GitHub
- **Email**: support@reconcraft.studio

---

## 🎉 What's Next?

- [ ] **WebSocket Support** - Real-time log streaming
- [ ] **Workflow Templates** - Pre-built workflows
- [ ] **Scheduled Scans** - Cron-based execution
- [ ] **Report Templates** - Custom PDF reports
- [ ] **Multi-tenancy** - Organization support
- [ ] **RBAC** - Role-based access control
- [ ] **AI Integration** - LangChain/LangGraph

---

**Built with ❤️ for security professionals**

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: 2025-01-25
