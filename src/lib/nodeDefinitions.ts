import { NodeKind, NodeCategory } from '@/types/workflow';
import {
  Play,
  Radar,
  Globe,
  FileSearch,
  Shield,
  MessageSquare,
  Send,
  FileText,
  Clock,
  GitBranch,
  LucideIcon,
} from 'lucide-react';

export interface NodeDefinition {
  kind: NodeKind;
  label: string;
  category: NodeCategory;
  icon: LucideIcon;
  description: string;
  defaultConfig: Record<string, any>;
  configSchema: {
    field: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'array';
    options?: string[];
    placeholder?: string;
  }[];
}

export const nodeDefinitions: Record<NodeKind, NodeDefinition> = {
  start: {
    kind: 'start',
    label: 'Start',
    category: 'utilities',
    icon: Play,
    description: 'Workflow entry point',
    defaultConfig: {},
    configSchema: [],
  },
  nmap: {
    kind: 'nmap',
    label: 'Nmap Scan',
    category: 'recon',
    icon: Radar,
    description: 'Network port scanning',
    defaultConfig: {
      targets: [],
      profile: 'quick',
      flags: '-sV',
    },
    configSchema: [
      {
        field: 'targets',
        label: 'Target(s)',
        type: 'array',
        placeholder: 'e.g., 10.0.2.3, 192.168.1.0/24',
      },
      {
        field: 'profile',
        label: 'Scan Profile',
        type: 'select',
        options: ['quick', 'deep', 'udp', 'custom'],
      },
      {
        field: 'flags',
        label: 'Additional Flags',
        type: 'textarea',
        placeholder: 'e.g., -sV -O -A',
      },
    ],
  },
  'http-probe': {
    kind: 'http-probe',
    label: 'HTTP Probe',
    category: 'recon',
    icon: Globe,
    description: 'HTTP/HTTPS service discovery',
    defaultConfig: {
      timeout: 5,
      followRedirects: true,
    },
    configSchema: [
      {
        field: 'timeout',
        label: 'Timeout (seconds)',
        type: 'text',
        placeholder: '5',
      },
      {
        field: 'followRedirects',
        label: 'Follow Redirects',
        type: 'checkbox',
      },
    ],
  },
  parser: {
    kind: 'parser',
    label: 'Parser/Rules',
    category: 'analysis',
    icon: FileSearch,
    description: 'Parse and apply detection rules',
    defaultConfig: {
      rules: [],
    },
    configSchema: [
      {
        field: 'rules',
        label: 'Detection Rules',
        type: 'array',
        placeholder: 'Add rules',
      },
    ],
  },
  gitleaks: {
    kind: 'gitleaks',
    label: 'Gitleaks',
    category: 'security',
    icon: Shield,
    description: 'Secret scanning in repositories',
    defaultConfig: {
      repoUrl: '',
      branch: 'main',
    },
    configSchema: [
      {
        field: 'repoUrl',
        label: 'Repository URL',
        type: 'text',
        placeholder: 'https://github.com/user/repo',
      },
      {
        field: 'branch',
        label: 'Branch',
        type: 'text',
        placeholder: 'main',
      },
    ],
  },
  slack: {
    kind: 'slack',
    label: 'Slack Alert',
    category: 'output',
    icon: MessageSquare,
    description: 'Send notifications to Slack',
    defaultConfig: {
      webhookUrl: '',
      message: '[ShipSec] Recon results for {{target}}',
    },
    configSchema: [
      {
        field: 'webhookUrl',
        label: 'Webhook URL',
        type: 'text',
        placeholder: 'https://hooks.slack.com/services/...',
      },
      {
        field: 'message',
        label: 'Message Template',
        type: 'textarea',
        placeholder: 'Use {{target}}, {{ports}}, {{findings}}',
      },
    ],
  },
  discord: {
    kind: 'discord',
    label: 'Discord Alert',
    category: 'output',
    icon: Send,
    description: 'Send notifications to Discord',
    defaultConfig: {
      webhookUrl: '',
      message: '**ShipSec Alert**\nScan complete',
    },
    configSchema: [
      {
        field: 'webhookUrl',
        label: 'Webhook URL',
        type: 'text',
        placeholder: 'https://discord.com/api/webhooks/...',
      },
      {
        field: 'message',
        label: 'Message Template',
        type: 'textarea',
        placeholder: 'Markdown supported',
      },
    ],
  },
  report: {
    kind: 'report',
    label: 'Report Export',
    category: 'output',
    icon: FileText,
    description: 'Generate PDF reports',
    defaultConfig: {
      title: 'Security Report',
      includeSections: ['summary', 'findings', 'recommendations'],
    },
    configSchema: [
      {
        field: 'title',
        label: 'Report Title',
        type: 'text',
        placeholder: 'Security Assessment Report',
      },
      {
        field: 'includeSections',
        label: 'Include Sections',
        type: 'array',
      },
    ],
  },
  delay: {
    kind: 'delay',
    label: 'Delay',
    category: 'utilities',
    icon: Clock,
    description: 'Wait before continuing',
    defaultConfig: {
      duration: 5,
    },
    configSchema: [
      {
        field: 'duration',
        label: 'Duration (seconds)',
        type: 'text',
        placeholder: '5',
      },
    ],
  },
  condition: {
    kind: 'condition',
    label: 'Condition',
    category: 'utilities',
    icon: GitBranch,
    description: 'Conditional branching',
    defaultConfig: {
      condition: '',
    },
    configSchema: [
      {
        field: 'condition',
        label: 'Condition Expression',
        type: 'textarea',
        placeholder: 'e.g., findings.length > 0',
      },
    ],
  },
};

export const getCategoryColor = (category: NodeCategory): string => {
  const colors: Record<NodeCategory, string> = {
    recon: 'bg-primary/10 text-primary border-primary/30',
    analysis: 'bg-chart-2/10 text-chart-2 border-chart-2/30',
    security: 'bg-destructive/10 text-destructive border-destructive/30',
    output: 'bg-success/10 text-success border-success/30',
    utilities: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  };
  return colors[category];
};
