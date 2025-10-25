# Deployment Guide

This guide covers various deployment options for ReconCraft Backend.

## Table of Contents

1. [Docker Compose (Local/Demo)](#docker-compose)
2. [AWS ECS](#aws-ecs)
3. [Simple EC2 Deployment](#ec2-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Security Hardening](#security-hardening)

---

## Docker Compose

### Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd recon-craft-studio/backend

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f api worker

# 6. Create first API key
docker-compose exec api python -c "
from app.services.auth_service import AuthService
from app.core.database import db_manager
import asyncio

async def create_key():
    await db_manager.connect()
    service = AuthService(db_manager.db)
    key = await service.create_api_key({'userId': 'admin', 'name': 'Admin Key'})
    print(f'API Key: {key.key}')
    await db_manager.disconnect()

asyncio.run(create_key())
"
```

### Updating

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

---

## AWS ECS

### Prerequisites

- AWS CLI configured
- Docker installed
- ECR repository created
- ECS cluster created

### Step 1: Build and Push Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build images
docker build -f docker/Dockerfile.api -t reconcraft-api:latest .
docker build -f docker/Dockerfile.worker -t reconcraft-worker:latest .

# Tag images
docker tag reconcraft-api:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/reconcraft-api:latest
docker tag reconcraft-worker:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/reconcraft-worker:latest

# Push to ECR
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/reconcraft-api:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/reconcraft-worker:latest
```

### Step 2: Set up MongoDB and Redis

Option A: Managed Services
- **MongoDB**: Use MongoDB Atlas
- **Redis**: Use AWS ElastiCache

Option B: Self-hosted
- Deploy MongoDB and Redis on EC2 or ECS

### Step 3: Create ECS Task Definitions

**API Task Definition** (`task-def-api.json`):

```json
{
  "family": "reconcraft-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/reconcraft-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "MONGODB_URL",
          "value": "mongodb://YOUR_MONGODB_URL"
        },
        {
          "name": "REDIS_HOST",
          "value": "YOUR_REDIS_HOST"
        }
      ],
      "secrets": [
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:reconcraft/secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/reconcraft-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Worker Task Definition**: Similar structure, but use worker image and command `["python", "worker.py"]`

### Step 4: Create ECS Services

```bash
# Create API service
aws ecs create-service \
  --cluster reconcraft \
  --service-name reconcraft-api \
  --task-definition reconcraft-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"

# Create Worker service
aws ecs create-service \
  --cluster reconcraft \
  --service-name reconcraft-worker \
  --task-definition reconcraft-worker \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Step 5: Set up Load Balancer

1. Create Application Load Balancer
2. Create target group for port 8000
3. Configure health check: `/api/health`
4. Add listener rule to forward traffic

---

## EC2 Deployment

### Step 1: Launch EC2 Instance

```bash
# Use Amazon Linux 2 or Ubuntu
# Instance type: t3.medium or larger
# Security group: Allow ports 22, 8000, 80, 443
```

### Step 2: Install Dependencies

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install -y git
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone <repo-url>
cd recon-craft-studio/backend

# Configure environment
cp .env.example .env
nano .env  # Edit configuration

# Start services
docker-compose up -d

# Set up systemd service for auto-restart
sudo nano /etc/systemd/system/reconcraft.service
```

**systemd service file**:

```ini
[Unit]
Description=ReconCraft Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/recon-craft-studio/backend
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable service
sudo systemctl enable reconcraft
sudo systemctl start reconcraft
```

### Step 4: Set up Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo yum install -y nginx

# Configure Nginx
sudo nano /etc/nginx/conf.d/reconcraft.conf
```

**Nginx config**:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Environment Configuration

### Required Variables

```env
# Application
APP_NAME=ReconCraft Backend
APP_ENV=production
DEBUG=false

# Database
MONGODB_URL=mongodb://username:password@host:27017
MONGODB_DB_NAME=reconcraft

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Security
SECRET_KEY=CHANGE_THIS_TO_STRONG_RANDOM_STRING
ALGORITHM=HS256

# CORS
CORS_ORIGINS=https://your-frontend-domain.com

# Docker
DOCKER_MEMORY_LIMIT=512m
DOCKER_CPU_LIMIT=1.0
```

### Generating Secure SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Security Hardening

### 1. Network Security

```bash
# Firewall rules (AWS Security Groups)
- Allow 443 (HTTPS) from 0.0.0.0/0
- Allow 22 (SSH) from your IP only
- MongoDB: Private subnet only
- Redis: Private subnet only
```

### 2. Docker Security

```yaml
# docker-compose.yml
services:
  api:
    security_opt:
      - no-new-privileges:true
      - seccomp=seccomp-profile.json
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### 3. MongoDB Security

```javascript
// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password",
  roles: ["root"]
})

// Create app user
use reconcraft
db.createUser({
  user: "reconcraft_user",
  pwd: "strong_password",
  roles: [
    { role: "readWrite", db: "reconcraft" }
  ]
})
```

### 4. Redis Security

```bash
# redis.conf
requirepass your_strong_password
bind 127.0.0.1
protected-mode yes
```

### 5. SSL/TLS

Use Let's Encrypt with Nginx:

```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Monitoring

Set up CloudWatch (AWS) or monitoring solution:

```python
# Add to app/core/logging.py
import boto3

# Send logs to CloudWatch
cloudwatch = boto3.client('logs')
```

---

## Backup Strategy

### MongoDB Backup

```bash
# Create backup
docker-compose exec mongodb mongodump --out /backup

# Restore backup
docker-compose exec mongodb mongorestore /backup
```

### Automated Backups

```bash
# Cron job for daily backups
0 2 * * * docker-compose exec mongodb mongodump --out /backup/$(date +\%Y\%m\%d) && aws s3 sync /backup s3://your-backup-bucket/
```

---

## Monitoring & Logging

### CloudWatch Logs

```bash
# Install CloudWatch agent
sudo yum install amazon-cloudwatch-agent

# Configure log forwarding
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### Application Metrics

The `/api/metrics` endpoint provides:
- Total workflows/runs/targets
- Success rate
- Queue depth

Integrate with Prometheus/Grafana for visualization.

---

## Troubleshooting

### Check service health

```bash
curl http://localhost:8000/api/health
```

### View logs

```bash
docker-compose logs -f api worker
```

### Check database connectivity

```bash
docker-compose exec api python -c "from pymongo import MongoClient; print(MongoClient('mongodb://mongodb:27017').server_info())"
```

### Check Redis

```bash
docker-compose exec redis redis-cli ping
```

---

## Scaling

### Horizontal Scaling

1. **API**: Scale up ECS service desired count or add more EC2 instances behind load balancer
2. **Workers**: Increase worker count to handle more concurrent jobs
3. **Database**: Use MongoDB sharding or read replicas
4. **Redis**: Use Redis Cluster for high availability

### Vertical Scaling

Increase CPU/memory for containers in task definitions or docker-compose.

---

## Support

For deployment issues, open an issue on GitHub or contact support.
