import { Workflow, Run, Target, WorkflowNode, WorkflowEdge } from '@/types/workflow';

export const mockTargets: Target[] = [
  {
    id: 't1',
    value: '10.0.2.3',
    tags: ['demo', 'internal'],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 't2',
    value: '192.168.1.0/24',
    tags: ['staging'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 't3',
    value: 'demo.shipsec.local',
    tags: ['demo', 'dns'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 't4',
    value: 'api.example.com',
    tags: ['production'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const demoNodes: WorkflowNode[] = [
  {
    id: 'start-1',
    kind: 'start',
    label: 'Start',
    category: 'utilities',
    config: {},
    position: { x: 100, y: 100 },
  },
  {
    id: 'nmap-1',
    kind: 'nmap',
    label: 'Nmap Scan',
    category: 'recon',
    config: {
      targets: ['10.0.2.3', 'demo.shipsec.local'],
      profile: 'quick',
      flags: '-sV -O',
    },
    position: { x: 300, y: 100 },
  },
  {
    id: 'http-probe-1',
    kind: 'http-probe',
    label: 'HTTP Probe',
    category: 'recon',
    config: {
      timeout: 5,
      followRedirects: true,
    },
    position: { x: 500, y: 100 },
  },
  {
    id: 'parser-1',
    kind: 'parser',
    label: 'Parse Results',
    category: 'analysis',
    config: {
      rules: [
        { service: 'ssh', version: '<7.0', note: 'Outdated SSH version', severity: 'high' },
        { service: 'http', version: '*', note: 'HTTP service detected', severity: 'low' },
      ],
    },
    position: { x: 700, y: 100 },
  },
  {
    id: 'slack-1',
    kind: 'slack',
    label: 'Slack Alert',
    category: 'output',
    config: {
      webhookUrl: 'https://hooks.slack.com/services/...',
      message: '[ShipSec] Recon results for {{target}}\n• Open ports: {{ports}}\n• Recommended next steps: {{recommendations}}',
    },
    position: { x: 900, y: 50 },
  },
  {
    id: 'report-1',
    kind: 'report',
    label: 'Generate Report',
    category: 'output',
    config: {
      title: 'Quick Recon Report',
      includeSections: ['summary', 'findings', 'recommendations'],
    },
    position: { x: 900, y: 200 },
  },
];

const demoEdges: WorkflowEdge[] = [
  { id: 'e1', source: 'start-1', target: 'nmap-1', label: 'start' },
  { id: 'e2', source: 'nmap-1', target: 'http-probe-1', label: 'onSuccess' },
  { id: 'e3', source: 'http-probe-1', target: 'parser-1', label: 'onSuccess' },
  { id: 'e4', source: 'parser-1', target: 'slack-1', label: 'onSuccess' },
  { id: 'e5', source: 'parser-1', target: 'report-1', label: 'onComplete' },
];

export const mockWorkflows: Workflow[] = [
  {
    id: 'wf1',
    name: 'Quick Recon',
    nodes: demoNodes,
    edges: demoEdges,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    authorizedTargets: true,
  },
  {
    id: 'wf2',
    name: 'Deep Security Scan',
    nodes: [
      {
        id: 'start-2',
        kind: 'start',
        label: 'Start',
        category: 'utilities',
        config: {},
        position: { x: 100, y: 100 },
      },
      {
        id: 'nmap-2',
        kind: 'nmap',
        label: 'Full Port Scan',
        category: 'recon',
        config: {
          targets: ['10.0.2.3'],
          profile: 'deep',
          flags: '-p- -sV -sC -A',
        },
        position: { x: 300, y: 100 },
      },
      {
        id: 'gitleaks-1',
        kind: 'gitleaks',
        label: 'Gitleaks Scan',
        category: 'security',
        config: {
          repoUrl: 'https://github.com/example/repo',
          branch: 'main',
        },
        position: { x: 300, y: 250 },
      },
      {
        id: 'discord-1',
        kind: 'discord',
        label: 'Discord Alert',
        category: 'output',
        config: {
          webhookUrl: 'https://discord.com/api/webhooks/...',
          message: '**ShipSec Alert**\nScan complete for {{target}}',
        },
        position: { x: 500, y: 175 },
      },
    ],
    edges: [
      { id: 'e1', source: 'start-2', target: 'nmap-2' },
      { id: 'e2', source: 'start-2', target: 'gitleaks-1' },
      { id: 'e3', source: 'nmap-2', target: 'discord-1' },
      { id: 'e4', source: 'gitleaks-1', target: 'discord-1' },
    ],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    authorizedTargets: true,
  },
  {
    id: 'wf3',
    name: 'API Endpoint Discovery',
    nodes: [
      {
        id: 'start-3',
        kind: 'start',
        label: 'Start',
        category: 'utilities',
        config: {},
        position: { x: 100, y: 100 },
      },
      {
        id: 'http-probe-2',
        kind: 'http-probe',
        label: 'HTTP Probe',
        category: 'recon',
        config: {},
        position: { x: 300, y: 100 },
      },
    ],
    edges: [{ id: 'e1', source: 'start-3', target: 'http-probe-2' }],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    authorizedTargets: false,
  },
];

export const mockRuns: Run[] = [
  {
    id: 'run1',
    workflowId: 'wf1',
    workflowName: 'Quick Recon',
    status: 'succeeded',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    endedAt: new Date(Date.now() - 3300000).toISOString(),
    duration: 300,
    steps: [
      {
        nodeId: 'start-1',
        name: 'Start',
        status: 'succeeded',
        logs: ['[00:00] Workflow started'],
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        nodeId: 'nmap-1',
        name: 'Nmap Scan',
        status: 'succeeded',
        logs: [
          '[00:01] Starting Nmap 7.94',
          '[00:02] Nmap scan report for 10.0.2.3',
          '[00:02] Host is up (0.00034s latency)',
          '[00:03] PORT     STATE SERVICE VERSION',
          '[00:03] 22/tcp   open  ssh     OpenSSH 8.9p1',
          '[00:04] 80/tcp   open  http    nginx 1.22.0',
          '[00:05] 443/tcp  open  ssl/http nginx 1.22.0',
          '[00:05] Nmap done: 1 IP address (1 host up) scanned in 4.23 seconds',
        ],
        findings: [
          {
            id: 'f1',
            severity: 'low',
            title: 'SSH Service Detected',
            description: 'OpenSSH 8.9p1 running on port 22',
            service: 'ssh',
            port: 22,
          },
          {
            id: 'f2',
            severity: 'low',
            title: 'HTTP Service Detected',
            description: 'nginx 1.22.0 running on port 80',
            service: 'http',
            port: 80,
          },
        ],
        startedAt: new Date(Date.now() - 3599000).toISOString(),
        completedAt: new Date(Date.now() - 3595000).toISOString(),
      },
      {
        nodeId: 'http-probe-1',
        name: 'HTTP Probe',
        status: 'succeeded',
        logs: [
          '[00:06] Probing http://10.0.2.3',
          '[00:06] [200] http://10.0.2.3 - nginx/1.22.0',
          '[00:07] Title: Welcome to nginx!',
          '[00:07] Server: nginx/1.22.0',
        ],
        startedAt: new Date(Date.now() - 3594000).toISOString(),
        completedAt: new Date(Date.now() - 3590000).toISOString(),
      },
      {
        nodeId: 'parser-1',
        name: 'Parse Results',
        status: 'succeeded',
        logs: [
          '[00:08] Processing scan results',
          '[00:08] Found 2 services',
          '[00:08] Applying 2 rules',
          '[00:09] Analysis complete',
        ],
        startedAt: new Date(Date.now() - 3589000).toISOString(),
        completedAt: new Date(Date.now() - 3585000).toISOString(),
      },
      {
        nodeId: 'slack-1',
        name: 'Slack Alert',
        status: 'succeeded',
        logs: [
          '[00:10] Sending alert to Slack',
          '[00:10] Message posted successfully',
        ],
        startedAt: new Date(Date.now() - 3584000).toISOString(),
        completedAt: new Date(Date.now() - 3580000).toISOString(),
      },
    ],
    summary: {
      findingsCount: 2,
      severities: {
        low: 2,
        medium: 0,
        high: 0,
        critical: 0,
      },
    },
  },
  {
    id: 'run2',
    workflowId: 'wf1',
    workflowName: 'Quick Recon',
    status: 'failed',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    endedAt: new Date(Date.now() - 86400000 + 120000).toISOString(),
    duration: 120,
    steps: [
      {
        nodeId: 'start-1',
        name: 'Start',
        status: 'succeeded',
        logs: ['[00:00] Workflow started'],
      },
      {
        nodeId: 'nmap-1',
        name: 'Nmap Scan',
        status: 'failed',
        logs: [
          '[00:01] Starting Nmap 7.94',
          '[00:02] Failed to resolve "invalid.target"',
          '[00:02] ERROR: Unable to complete scan',
        ],
      },
    ],
    summary: {
      findingsCount: 0,
      severities: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    },
  },
  {
    id: 'run3',
    workflowId: 'wf2',
    workflowName: 'Deep Security Scan',
    status: 'running',
    startedAt: new Date(Date.now() - 300000).toISOString(),
    steps: [
      {
        nodeId: 'start-2',
        name: 'Start',
        status: 'succeeded',
        logs: ['[00:00] Workflow started'],
      },
      {
        nodeId: 'nmap-2',
        name: 'Full Port Scan',
        status: 'running',
        logs: [
          '[00:01] Starting Nmap 7.94',
          '[00:02] Scanning all 65535 ports...',
          '[00:05] Progress: 23% complete',
        ],
      },
      {
        nodeId: 'gitleaks-1',
        name: 'Gitleaks Scan',
        status: 'pending',
        logs: [],
      },
    ],
  },
  {
    id: 'run4',
    workflowId: 'wf1',
    workflowName: 'Quick Recon',
    status: 'succeeded',
    startedAt: new Date(Date.now() - 172800000).toISOString(),
    endedAt: new Date(Date.now() - 172800000 + 245000).toISOString(),
    duration: 245,
    steps: [
      {
        nodeId: 'start-1',
        name: 'Start',
        status: 'succeeded',
        logs: ['[00:00] Workflow started'],
      },
      {
        nodeId: 'nmap-1',
        name: 'Nmap Scan',
        status: 'succeeded',
        logs: [
          '[00:01] Nmap scan completed',
          '[00:01] Found 3 open ports',
        ],
        findings: [
          {
            id: 'f3',
            severity: 'high',
            title: 'Outdated SSH Version',
            description: 'OpenSSH 6.7 detected - multiple known vulnerabilities',
            service: 'ssh',
            port: 22,
          },
        ],
      },
    ],
    summary: {
      findingsCount: 1,
      severities: {
        low: 0,
        medium: 0,
        high: 1,
        critical: 0,
      },
    },
  },
];
