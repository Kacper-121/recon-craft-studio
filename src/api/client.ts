import { Workflow, Run, Target, Settings } from '@/types/workflow';
import { mockWorkflows, mockRuns, mockTargets } from '@/lib/mockData';

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API Client
export const api = {
  // Workflows
  async listWorkflows(): Promise<Workflow[]> {
    await delay(300);
    return [...mockWorkflows];
  },

  async getWorkflow(id: string): Promise<Workflow | null> {
    await delay(200);
    return mockWorkflows.find((w) => w.id === id) || null;
  },

  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    await delay(400);
    console.log('Saving workflow:', workflow);
    return workflow;
  },

  async deleteWorkflow(id: string): Promise<void> {
    await delay(300);
    console.log('Deleting workflow:', id);
  },

  async duplicateWorkflow(id: string): Promise<Workflow> {
    await delay(400);
    const original = mockWorkflows.find((w) => w.id === id);
    if (!original) throw new Error('Workflow not found');
    
    const duplicate: Workflow = {
      ...original,
      id: `wf-${Date.now()}`,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Duplicated workflow:', duplicate);
    return duplicate;
  },

  // Runs
  async listRuns(): Promise<Run[]> {
    await delay(300);
    return [...mockRuns];
  },

  async getRun(id: string): Promise<Run | null> {
    await delay(200);
    return mockRuns.find((r) => r.id === id) || null;
  },

  async runWorkflow(workflowId: string): Promise<Run> {
    await delay(500);
    const workflow = mockWorkflows.find((w) => w.id === workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const run: Run = {
      id: `run-${Date.now()}`,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: 'queued',
      startedAt: new Date().toISOString(),
      steps: workflow.nodes.map((node) => ({
        nodeId: node.id,
        name: node.label,
        status: 'pending' as const,
        logs: [],
      })),
    };

    console.log('Started workflow run:', run);
    return run;
  },

  async streamRunLogs(runId: string, onLog: (log: string) => void): Promise<void> {
    // Simulate streaming logs
    const logs = [
      '[00:00] Initializing workflow',
      '[00:01] Starting Nmap scan',
      '[00:02] Scanning target 10.0.2.3',
      '[00:04] Found 3 open ports: 22, 80, 443',
      '[00:05] Running service detection',
      '[00:07] Services identified: ssh, http, https',
      '[00:08] Scan complete',
      '[00:09] Generating report',
      '[00:10] Workflow completed successfully',
    ];

    for (const log of logs) {
      await delay(800);
      onLog(log);
    }
  },

  // Targets
  async listTargets(): Promise<Target[]> {
    await delay(200);
    return [...mockTargets];
  },

  async saveTarget(target: Omit<Target, 'id' | 'createdAt'>): Promise<Target> {
    await delay(300);
    const newTarget: Target = {
      ...target,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    console.log('Saved target:', newTarget);
    return newTarget;
  },

  async deleteTarget(id: string): Promise<void> {
    await delay(200);
    console.log('Deleted target:', id);
  },

  async bulkImportTargets(targets: string[]): Promise<Target[]> {
    await delay(500);
    const newTargets: Target[] = targets.map((value, i) => ({
      id: `t-${Date.now()}-${i}`,
      value,
      tags: [],
      createdAt: new Date().toISOString(),
    }));
    console.log('Bulk imported targets:', newTargets);
    return newTargets;
  },

  // Settings
  async getSettings(): Promise<Settings> {
    await delay(200);
    return {
      theme: 'dark',
      integrations: {
        slack: {
          type: 'slack',
          webhookUrl: 'https://hooks.slack.com/services/...',
          enabled: true,
        },
      },
    };
  },

  async saveSettings(settings: Settings): Promise<Settings> {
    await delay(300);
    console.log('Saved settings:', settings);
    return settings;
  },

  // Integrations
  async sendToSlack(runId: string): Promise<void> {
    await delay(400);
    console.log('Sent to Slack:', runId);
  },

  async sendToDiscord(runId: string): Promise<void> {
    await delay(400);
    console.log('Sent to Discord:', runId);
  },

  // Export
  async exportWorkflows(): Promise<Blob> {
    await delay(300);
    const data = JSON.stringify(mockWorkflows, null, 2);
    return new Blob([data], { type: 'application/json' });
  },

  async exportReport(runId: string): Promise<Blob> {
    await delay(500);
    const mockPdf = 'Mock PDF Report for run: ' + runId;
    return new Blob([mockPdf], { type: 'application/pdf' });
  },
};
