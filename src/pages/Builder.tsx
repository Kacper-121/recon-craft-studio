import { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { NodePalette } from '@/components/workflow/NodePalette';
import { NodeInspector } from '@/components/workflow/NodeInspector';
import { RunConsole } from '@/components/workflow/RunConsole';
import { nodeDefinitions } from '@/lib/nodeDefinitions';
import { NodeKind, WorkflowNode } from '@/types/workflow';
import { toast } from 'sonner';
import { Play, Save, Copy, FileText } from 'lucide-react';
import {
  useGetWorkflowQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDuplicateWorkflowMutation,
  useStartRunMutation,
  useGetRunQuery,
} from '@/api/reconCraftApi';

// Custom node component
function CustomNode({ data }: { data: any }) {
  const definition = nodeDefinitions[data.kind as NodeKind];
  const Icon = definition.icon;
  
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg border-2 border-primary/30 bg-card min-w-[150px]">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export default function Builder() {
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('id');

  // RTK Query hooks
  const { data: currentWorkflow, isLoading: loadingWorkflow } = useGetWorkflowQuery(workflowId!, {
    skip: !workflowId,
  });
  const [createWorkflow] = useCreateWorkflowMutation();
  const [updateWorkflow] = useUpdateWorkflowMutation();
  const [duplicateWorkflowMutation] = useDuplicateWorkflowMutation();
  const [startRunMutation] = useStartRunMutation();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [authorized, setAuthorized] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Poll for run updates when a run is active
  const { data: currentRun } = useGetRunQuery(currentRunId!, {
    skip: !currentRunId,
    pollingInterval: 2000, // Poll every 2 seconds
  });

  useEffect(() => {
    if (currentWorkflow) {
      setWorkflowName(currentWorkflow.name);
      setAuthorized(currentWorkflow.authorizedTargets);

      const flowNodes: Node[] = currentWorkflow.nodes.map((n) => ({
        id: n.id,
        type: 'custom',
        position: n.position,
        data: { ...n },
      }));

      const flowEdges: Edge[] = currentWorkflow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [currentWorkflow, setNodes, setEdges]);

  // Update logs when run data changes
  useEffect(() => {
    if (currentRun) {
      const newLogs: string[] = [];
      currentRun.steps.forEach((step) => {
        step.logs.forEach((log) => {
          newLogs.push(log);
        });
      });
      setLogs(newLogs);

      // Update running state
      if (currentRun.status === 'succeeded' || currentRun.status === 'failed') {
        setIsRunning(false);
        if (currentRun.status === 'succeeded') {
          toast.success('Workflow completed successfully');
        } else {
          toast.error('Workflow failed');
        }
      }
    }
  }, [currentRun]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDragStart = (nodeKind: NodeKind) => {
    // Store the node kind for drop
    (window as any).__draggedNodeKind = nodeKind;
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeKind = (window as any).__draggedNodeKind as NodeKind;
      if (!nodeKind) return;

      const definition = nodeDefinitions[nodeKind];
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const newNode: Node = {
        id: `${nodeKind}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          id: `${nodeKind}-${Date.now()}`,
          kind: nodeKind,
          label: definition.label,
          category: definition.category,
          config: { ...definition.defaultConfig },
        },
      };

      setNodes((nds) => nds.concat(newNode));
      delete (window as any).__draggedNodeKind;
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as unknown as WorkflowNode);
  }, []);

  const handleNodeUpdate = (nodeId: string, config: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config } } : n))
    );
    toast.success('Node updated');
  };

  const handleSave = async () => {
    try {
      const workflowNodes: WorkflowNode[] = nodes.map((n) => ({
        id: n.id,
        kind: n.data.kind,
        label: n.data.label,
        category: n.data.category,
        config: n.data.config,
        position: n.position,
      }));

      const workflowData = {
        name: workflowName,
        nodes: workflowNodes,
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
        })),
        authorizedTargets: authorized,
      };

      if (currentWorkflow?.id) {
        // Update existing workflow
        await updateWorkflow({
          id: currentWorkflow.id,
          workflow: workflowData,
        }).unwrap();
      } else {
        // Create new workflow
        await createWorkflow(workflowData).unwrap();
      }

      toast.success('Workflow saved');
    } catch (error: any) {
      toast.error(`Failed to save workflow: ${error.message || 'Unknown error'}`);
      console.error('Save error:', error);
    }
  };

  const handleDuplicate = async () => {
    if (currentWorkflow) {
      try {
        await duplicateWorkflowMutation(currentWorkflow.id).unwrap();
        toast.success('Workflow duplicated');
      } catch (error: any) {
        toast.error(`Failed to duplicate workflow: ${error.message || 'Unknown error'}`);
        console.error('Duplicate error:', error);
      }
    }
  };

  const handleRun = async () => {
    if (!authorized) {
      toast.error('Please check "Authorize Targets" before running');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Add nodes to your workflow before running');
      return;
    }

    if (!currentWorkflow?.id) {
      toast.error('Please save the workflow before running');
      return;
    }

    try {
      setIsRunning(true);
      setLogs([]);
      toast.success('Starting workflow...');

      // Get targets from workflow config or use default
      const targets = ['demo-target.example.com']; // TODO: Allow user to specify targets

      const run = await startRunMutation({
        workflowId: currentWorkflow.id,
        targets,
        runMode: 'demo', // TODO: Allow user to select mode
        authorizeTargets: authorized,
      }).unwrap();

      setCurrentRunId(run.id);
      toast.success('Workflow started');
    } catch (error: any) {
      setIsRunning(false);
      toast.error(`Failed to start workflow: ${error.message || 'Unknown error'}`);
      console.error('Run error:', error);
    }
  };

  const loadDemoWorkflow = () => {
    // This would load the demo workflow from mockData
    toast.success('Demo workflow loaded');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      <div className="w-64 flex-shrink-0">
        <NodePalette onNodeDragStart={onNodeDragStart} />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b bg-card px-4 py-3">
          <div className="flex items-center gap-4 flex-1">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="max-w-xs font-medium"
              placeholder="Workflow name"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="authorized"
                checked={authorized}
                onCheckedChange={(checked) => setAuthorized(checked as boolean)}
              />
              <Label htmlFor="authorized" className="cursor-pointer text-sm">
                Authorize Targets
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadDemoWorkflow}>
              <FileText className="h-4 w-4 mr-2" />
              Load Demo
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={!currentWorkflow}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={handleRun} disabled={isRunning || !authorized}>
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <RunConsole logs={logs} isRunning={isRunning} />
      </div>

      <div className="w-80 flex-shrink-0">
        <NodeInspector
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
}
