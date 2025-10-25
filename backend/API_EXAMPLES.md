# API Examples

Complete examples for interacting with the ReconCraft Backend API.

## Base URL

```
http://localhost:8000
```

---

## Authentication

### 1. Create API Key

```bash
curl -X POST http://localhost:8000/api/auth/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "name": "My Development Key"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "rcs_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789",
  "userId": "user123",
  "name": "My Development Key",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

**⚠️ Important:** Save the `key` value - it won't be shown again!

### 2. Exchange API Key for JWT Token

```bash
curl -X POST http://localhost:8000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "rcs_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer",
  "expiresIn": 1800
}
```

### 3. Use JWT Token in Requests

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:8000/api/workflows \
  -H "Authorization: Bearer $TOKEN"
```

---

## Workflows

### List All Workflows

```bash
curl -X GET http://localhost:8000/api/workflows \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
[
  {
    "id": "wf-001",
    "name": "Quick Network Scan",
    "nodes": [...],
    "edges": [...],
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z",
    "authorizedTargets": true
  }
]
```

### Get Single Workflow

```bash
curl -X GET http://localhost:8000/api/workflows/wf-001 \
  -H "Authorization: Bearer $TOKEN"
```

### Create Workflow

```bash
curl -X POST http://localhost:8000/api/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workflow",
    "nodes": [
      {
        "id": "node-1",
        "kind": "start",
        "label": "Start",
        "category": "utility",
        "config": {},
        "position": {"x": 0, "y": 0}
      },
      {
        "id": "node-2",
        "kind": "nmap",
        "label": "Nmap Scan",
        "category": "recon",
        "config": {
          "scanType": "quick",
          "ports": "1-1000"
        },
        "position": {"x": 200, "y": 0}
      },
      {
        "id": "node-3",
        "kind": "slackAlert",
        "label": "Send Alert",
        "category": "output",
        "config": {
          "message": "Scan completed"
        },
        "position": {"x": 400, "y": 0}
      }
    ],
    "edges": [
      {
        "id": "edge-1-2",
        "source": "node-1",
        "target": "node-2"
      },
      {
        "id": "edge-2-3",
        "source": "node-2",
        "target": "node-3"
      }
    ],
    "authorizedTargets": true
  }'
```

### Delete Workflow

```bash
curl -X DELETE http://localhost:8000/api/workflows/wf-001 \
  -H "Authorization: Bearer $TOKEN"
```

### Duplicate Workflow

```bash
curl -X POST http://localhost:8000/api/workflows/wf-001/duplicate \
  -H "Authorization: Bearer $TOKEN"
```

---

## Targets

### List Authorized Targets

```bash
curl -X GET http://localhost:8000/api/targets \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
[
  {
    "id": "tgt-001",
    "value": "192.168.1.100",
    "tags": ["production", "web-server"],
    "createdAt": "2025-01-15T10:00:00Z"
  },
  {
    "id": "tgt-002",
    "value": "10.0.0.0/24",
    "tags": ["internal", "test"],
    "createdAt": "2025-01-15T10:05:00Z"
  }
]
```

### Add Single Target

```bash
curl -X POST http://localhost:8000/api/targets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "192.168.1.100",
    "tags": ["production", "web-server"]
  }'
```

### Bulk Import Targets

```bash
curl -X POST http://localhost:8000/api/targets/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [
      "192.168.1.100",
      "192.168.1.101",
      "10.0.0.0/24",
      "example.com"
    ]
  }'
```

### Delete Target

```bash
curl -X DELETE http://localhost:8000/api/targets/tgt-001 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Runs

### Start Workflow Run

```bash
curl -X POST http://localhost:8000/api/runs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "wf-001",
    "targets": ["192.168.1.100", "192.168.1.101"],
    "authorizeTargets": true,
    "runMode": "live"
  }'
```

**Response:**
```json
{
  "runId": "run-550e8400",
  "status": "queued",
  "message": "Run queued successfully"
}
```

### Start Demo Run (No Real Execution)

```bash
curl -X POST http://localhost:8000/api/runs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "wf-001",
    "targets": ["192.168.1.100"],
    "authorizeTargets": true,
    "runMode": "demo"
  }'
```

### List All Runs

```bash
curl -X GET http://localhost:8000/api/runs \
  -H "Authorization: Bearer $TOKEN"
```

### Filter Runs by Workflow

```bash
curl -X GET "http://localhost:8000/api/runs?workflow_id=wf-001" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter Runs by Status

```bash
curl -X GET "http://localhost:8000/api/runs?status=running" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Run Details

```bash
curl -X GET http://localhost:8000/api/runs/run-550e8400 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "id": "run-550e8400",
  "workflowId": "wf-001",
  "workflowName": "Quick Network Scan",
  "status": "succeeded",
  "targets": ["192.168.1.100"],
  "authorizeTargets": true,
  "runMode": "live",
  "startedAt": "2025-01-15T10:00:00Z",
  "endedAt": "2025-01-15T10:05:00Z",
  "duration": 300,
  "steps": [
    {
      "nodeId": "node-2",
      "name": "Nmap Scan",
      "status": "succeeded",
      "logs": [
        "[2025-01-15T10:00:01Z] Starting Nmap Scan",
        "[2025-01-15T10:00:02Z] Starting nmap scan for 192.168.1.100",
        "[2025-01-15T10:04:59Z] Nmap scan completed for 192.168.1.100"
      ],
      "findings": [
        {
          "id": "finding-001",
          "severity": "medium",
          "title": "Open Port Detected",
          "description": "Port 22 (SSH) is open",
          "service": "ssh",
          "port": 22
        },
        {
          "id": "finding-002",
          "severity": "low",
          "title": "Open Port Detected",
          "description": "Port 80 (HTTP) is open",
          "service": "http",
          "port": 80
        }
      ],
      "startedAt": "2025-01-15T10:00:01Z",
      "completedAt": "2025-01-15T10:05:00Z"
    }
  ],
  "summary": {
    "findingsCount": 2,
    "severities": {
      "low": 1,
      "medium": 1,
      "high": 0,
      "critical": 0
    }
  },
  "userId": "user123"
}
```

### Get Run Logs (Paginated)

```bash
curl -X GET "http://localhost:8000/api/runs/run-550e8400/logs?offset=0&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "runId": "run-550e8400",
  "total": 125,
  "offset": 0,
  "limit": 50,
  "logs": [
    {
      "stepId": "node-2",
      "stepName": "Nmap Scan",
      "log": "[2025-01-15T10:00:01Z] Starting Nmap Scan"
    },
    {
      "stepId": "node-2",
      "stepName": "Nmap Scan",
      "log": "[2025-01-15T10:00:02Z] Starting nmap scan for 192.168.1.100"
    }
  ]
}
```

### Send Findings to Slack

```bash
curl -X POST http://localhost:8000/api/runs/run-550e8400/actions/send-slack \
  -H "Authorization: Bearer $TOKEN"
```

---

## Integrations

### Configure Slack Integration

```bash
curl -X POST http://localhost:8000/api/integrations/slack \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX",
    "enabled": true
  }'
```

### Get Slack Integration

```bash
curl -X GET http://localhost:8000/api/integrations/slack \
  -H "Authorization: Bearer $TOKEN"
```

### Configure Discord Integration

```bash
curl -X POST http://localhost:8000/api/integrations/discord \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://discord.com/api/webhooks/1234567890/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "enabled": true
  }'
```

### Get Discord Integration

```bash
curl -X GET http://localhost:8000/api/integrations/discord \
  -H "Authorization: Bearer $TOKEN"
```

---

## Health & Metrics

### Health Check

```bash
curl -X GET http://localhost:8000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "service": "ReconCraft Backend",
  "version": "v1",
  "checks": {
    "mongodb": "healthy",
    "redis": "healthy"
  }
}
```

### Metrics

```bash
curl -X GET http://localhost:8000/api/metrics
```

**Response:**
```json
{
  "timestamp": "2025-01-15T10:00:00Z",
  "counters": {
    "workflows_total": 15,
    "runs_total": 127,
    "runs_queued": 2,
    "runs_running": 3,
    "runs_succeeded": 112,
    "runs_failed": 10,
    "targets_total": 45,
    "api_keys_active": 8
  },
  "success_rate": 88.19
}
```

---

## Complete Example Workflow

Here's a complete example from authentication to running a workflow:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"

# 1. Create API Key (do this once)
echo "Creating API key..."
API_KEY_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/api-keys \
  -H "Content-Type: application/json" \
  -d '{"userId": "demo-user", "name": "Demo Key"}')

API_KEY=$(echo $API_KEY_RESPONSE | jq -r '.key')
echo "API Key: $API_KEY"

# 2. Get JWT Token
echo "Getting JWT token..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/token \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"$API_KEY\"}")

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.accessToken')
echo "Token acquired"

# 3. Add authorized target
echo "Adding authorized target..."
curl -s -X POST $BASE_URL/api/targets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "192.168.1.100",
    "tags": ["demo"]
  }' | jq

# 4. Create workflow
echo "Creating workflow..."
WORKFLOW_RESPONSE=$(curl -s -X POST $BASE_URL/api/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Scan",
    "nodes": [
      {
        "id": "1",
        "kind": "start",
        "label": "Start",
        "category": "utility",
        "config": {},
        "position": {"x": 0, "y": 0}
      },
      {
        "id": "2",
        "kind": "nmap",
        "label": "Nmap",
        "category": "recon",
        "config": {"scanType": "quick"},
        "position": {"x": 200, "y": 0}
      }
    ],
    "edges": [
      {"id": "e1", "source": "1", "target": "2"}
    ],
    "authorizedTargets": true
  }')

WORKFLOW_ID=$(echo $WORKFLOW_RESPONSE | jq -r '.id')
echo "Workflow ID: $WORKFLOW_ID"

# 5. Start run
echo "Starting run..."
RUN_RESPONSE=$(curl -s -X POST $BASE_URL/api/runs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"workflowId\": \"$WORKFLOW_ID\",
    \"targets\": [\"192.168.1.100\"],
    \"authorizeTargets\": true,
    \"runMode\": \"demo\"
  }")

RUN_ID=$(echo $RUN_RESPONSE | jq -r '.runId')
echo "Run ID: $RUN_ID"

# 6. Poll for results
echo "Waiting for run to complete..."
sleep 5

echo "Getting run details..."
curl -s -X GET $BASE_URL/api/runs/$RUN_ID \
  -H "Authorization: Bearer $TOKEN" | jq

echo "Done!"
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "detail": "Could not validate credentials"
}
```

**403 Forbidden:**
```json
{
  "detail": "Target 192.168.1.100 is not in authorized targets list"
}
```

**404 Not Found:**
```json
{
  "detail": "Workflow not found"
}
```

**400 Bad Request:**
```json
{
  "detail": "You must authorize targets before running the workflow"
}
```

**422 Validation Error:**
```json
{
  "detail": [
    {
      "loc": ["body", "targets"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## WebSocket Support (Future)

Real-time log streaming (planned):

```javascript
const ws = new WebSocket('ws://localhost:8000/api/runs/run-550e8400/logs/stream');

ws.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log(`[${log.timestamp}] ${log.message}`);
};
```

---

## Rate Limiting (Recommended for Production)

Consider implementing rate limiting:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/workflows")
@limiter.limit("100/minute")
async def list_workflows():
    ...
```

---

For more examples, see the API documentation at http://localhost:8000/api/docs
