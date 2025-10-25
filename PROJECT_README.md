# ShipSec Studio - No-Code Recon

A modern, production-quality frontend application for composing OSS security tools as drag-and-drop workflows.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:8080` to see the application.

## ✨ Features

### 🎯 Dashboard
- Overview of workflows and recent runs
- Quick stats and success rate metrics
- Dismissible security warning banner
- Quick access to create new workflows

### 🛠️ Workflow Builder
- **Visual Canvas**: React Flow-powered drag-and-drop interface
- **Node Palette**: Searchable library of security tools
  - Recon: Nmap Scan, HTTP Probe
  - Analysis: Parser/Rules
  - Security: Gitleaks (Repo Scanner)
  - Output: Slack Alert, Discord Alert, Report Export
  - Utilities: Start, Delay, Condition
- **Inspector Panel**: Dynamic configuration forms for each node type
- **Run Console**: Live streaming logs with tabs for Artifacts and JSON output
- **Demo Mode**: Load pre-configured sample workflows
- **Keyboard Shortcuts**: Delete nodes, undo/redo (⌘Z/⌘⇧Z)

### 📊 Runs Management
- Table view of all workflow executions
- Run status indicators (queued, running, succeeded, failed)
- Detailed run viewer with:
  - Step-by-step execution timeline
  - Per-step logs and findings
  - Severity-based findings summary
  - Quick actions (Send to Slack, Export Report)

### 🎯 Target Management
- CRUD operations for authorized targets
- Support for IPs, CIDR ranges, and hostnames
- Tag-based organization
- Bulk import via textarea
- Validation badges for target format

### ⚙️ Settings
- **Integrations**: Configure Slack and Discord webhooks
- **Appearance**: Light/Dark theme toggle
- **Data Export**: Download workflows as JSON
- **Legal Notice**: Authorized use disclaimer

### 📄 Reports
- Grid view of generated reports
- Report viewer with:
  - Executive summary
  - Detailed findings table
  - Recommended next steps
  - Export to PDF functionality

## 🏗️ Architecture

### Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Redux Toolkit
- **Workflow Canvas**: React Flow
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Project Structure
```
src/
├── api/              # Mock API client
├── components/       # Reusable UI components
│   ├── layout/       # Header, ThemeToggle
│   ├── ui/           # shadcn components
│   └── workflow/     # NodePalette, NodeInspector, RunConsole
├── lib/              # Utilities and node definitions
├── pages/            # Route pages
├── store/            # Redux slices
└── types/            # TypeScript definitions
```

### State Management
- **workflows**: Saved workflows, current workflow
- **runs**: Execution history, current run details
- **targets**: Authorized scan targets
- **settings**: Theme, integrations

### Mock Data
All data is currently mocked via `src/api/client.ts` and `src/lib/mockData.ts`. The API client uses `setTimeout` to simulate async operations.

## 🎨 Design System

### Colors
- **Primary**: Cyan (#06b6d4) - Trust and security
- **Success**: Green - Successful operations
- **Warning**: Amber - Warnings and alerts
- **Destructive**: Red - Errors and critical findings
- **Dark Theme**: Deep slate/charcoal backgrounds

### Typography
- **UI Text**: System font stack
- **Code/Logs**: Monospace (Cascadia Code, Source Code Pro, etc.)

### Components
All components follow the design system tokens defined in `src/index.css` and `tailwind.config.ts`. Custom variants are created for different contexts (e.g., status badges, severity indicators).

## 🔧 Customization

### Adding New Node Types
1. Define in `src/lib/nodeDefinitions.ts`
2. Add to `NodeKind` type in `src/types/workflow.ts`
3. Node will automatically appear in palette

### Mock API Responses
Edit `src/api/client.ts` to modify API behavior and response times.

### Seed Data
Modify `src/lib/mockData.ts` to change default workflows, runs, and targets.

## 🚦 Workflows

### Example: Quick Recon
```
Start → Nmap Scan → HTTP Probe → Parser/Rules → Slack Alert
                                                  ↓
                                             Report Export
```

This workflow:
1. Starts execution
2. Runs Nmap scan on authorized targets
3. Probes HTTP services
4. Applies detection rules
5. Sends alert to Slack
6. Generates PDF report

## 🔐 Security Notice

**⚠️ Important:** This is a demo/prototype application. Always ensure you have explicit authorization before scanning any target system. Unauthorized scanning may be illegal.

## 📝 TODO for Production

- [ ] Connect to real backend API
- [ ] Implement actual tool integrations (Nmap, Gitleaks, etc.)
- [ ] Add authentication and user management
- [ ] Implement real-time log streaming via WebSockets
- [ ] Add workflow version control
- [ ] Implement role-based access control
- [ ] Add workflow scheduling
- [ ] Implement actual PDF generation
- [ ] Add export/import for workflows
- [ ] Add workflow templates marketplace

## 🤝 Contributing

This is a hackathon/demo project. For production use, ensure proper security reviews and compliance checks.

## 📄 License

MIT
