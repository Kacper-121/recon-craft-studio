#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         ReconCraft Backend - Quick Start Setup            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env

    # Generate a secure SECRET_KEY
    if command -v python3 &> /dev/null; then
        SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
        sed -i.bak "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
        rm .env.bak 2>/dev/null || true
        echo "✅ Generated secure SECRET_KEY"
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🐳 Starting Docker containers..."
echo ""

# Start services
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for MongoDB
until docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; do
    echo "   Waiting for MongoDB..."
    sleep 2
done
echo "✅ MongoDB is ready"

# Wait for Redis
until docker-compose exec -T redis redis-cli ping &> /dev/null; do
    echo "   Waiting for Redis..."
    sleep 2
done
echo "✅ Redis is ready"

# Wait for API
echo "   Waiting for API..."
sleep 5
until curl -s http://localhost:8000/api/health > /dev/null; do
    echo "   Still waiting for API..."
    sleep 2
done
echo "✅ API is ready"

echo ""
echo "🎲 Initializing database with sample data..."
docker-compose exec -T api python scripts/init-db.py

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   🎉 Setup Complete!                       ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  API:       http://localhost:8000                          ║"
echo "║  Docs:      http://localhost:8000/api/docs                 ║"
echo "║  Health:    http://localhost:8000/api/health               ║"
echo "║  Metrics:   http://localhost:8000/api/metrics              ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  MongoDB:   localhost:27017                                ║"
echo "║  Redis:     localhost:6379                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📚 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart"
echo "   Run tests:        docker-compose exec api pytest"
echo ""
echo "📖 See README.md and API_EXAMPLES.md for more information"
echo ""
