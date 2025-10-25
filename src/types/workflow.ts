export type NodeKind = 
  | 'start'
  | 'nmap'
  | 'http-probe'
  | 'parser'
  | 'gitleaks'
  | 'slack'
  | 'discord'
  | 'report'
  | 'delay'
  | 'condition';

export type NodeCategory = 'recon' | 'analysis' | 'security' | 'output' | 'utilities';

export interface WorkflowNode {
  id: string;
  kind: NodeKind;
  label: string;
  category: NodeCategory;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  authorizedTargets: boolean;
}

export interface Finding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  service?: string;
  port?: number;
}

export interface RunStep {
  nodeId: string;
  name: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  logs: string[];
  findings?: Finding[];
  startedAt?: string;
  completedAt?: string;
}

export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface Run {
  id: string;
  workflowId: string;
  workflowName: string;
  status: RunStatus;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  steps: RunStep[];
  summary?: {
    findingsCount: number;
    severities: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
}

export interface Target {
  id: string;
  value: string;
  tags: string[];
  createdAt: string;
}

export interface Integration {
  type: 'slack' | 'discord';
  webhookUrl: string;
  enabled: boolean;
}

export interface Settings {
  theme: 'light' | 'dark';
  integrations: {
    slack?: Integration;
    discord?: Integration;
  };
}

export type RunMode = 'live' | 'demo';

export interface ApiKey {
  id: string;
  name: string;
  key?: string; // Only provided on creation
  keyPrefix: string;
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
}
