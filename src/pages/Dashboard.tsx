import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RunStatus } from '@/types/workflow';
import { formatDistanceToNow } from 'date-fns';
import { useGetWorkflowsQuery, useGetRunsQuery, useGetMetricsQuery } from '@/api/reconCraftApi';

const statusConfig: Record<RunStatus, { icon: any; variant: string; label: string }> = {
  queued: { icon: Clock, variant: 'secondary', label: 'Queued' },
  running: { icon: Play, variant: 'default', label: 'Running' },
  succeeded: { icon: CheckCircle2, variant: 'default', label: 'Succeeded' },
  failed: { icon: XCircle, variant: 'destructive', label: 'Failed' },
};

export default function Dashboard() {
  const [showBanner, setShowBanner] = useState(true);

  // Use RTK Query hooks for data fetching
  const { data: workflows = [], isLoading: loadingWorkflows } = useGetWorkflowsQuery();
  const { data: runs = [], isLoading: loadingRuns } = useGetRunsQuery({ limit: 5 });
  const { data: metrics } = useGetMetricsQuery();

  const recentRuns = runs.slice(0, 5);

  return (
    <div className="container py-8">
      {showBanner && (
        <Alert className="mb-6 border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> Only scan assets you're authorized to test. Unauthorized
            scanning may be illegal.
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => setShowBanner(false)}
          >
            ×
          </Button>
        </Alert>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your security reconnaissance workflows and runs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active security workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Workflow executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {runs.length > 0
                ? Math.round((runs.filter((r) => r.status === 'succeeded').length / runs.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successful runs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Saved Workflows</CardTitle>
              <Link to="/builder">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </Link>
            </div>
            <CardDescription>Your security reconnaissance workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No workflows yet</p>
                  <Link to="/builder">
                    <Button>Create Your First Workflow</Button>
                  </Link>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <Link key={workflow.id} to={`/builder?id=${workflow.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-smooth cursor-pointer">
                      <div>
                        <div className="font-medium">{workflow.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {workflow.nodes.length} nodes • Updated{' '}
                          {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge variant={workflow.authorizedTargets ? 'default' : 'secondary'}>
                        {workflow.authorizedTargets ? 'Authorized' : 'Draft'}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Runs</CardTitle>
              <Link to="/runs">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>Latest workflow executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No runs yet</p>
                </div>
              ) : (
                recentRuns.map((run) => {
                  const config = statusConfig[run.status];
                  const StatusIcon = config.icon;
                  return (
                    <Link key={run.id} to={`/runs?id=${run.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-smooth cursor-pointer">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{run.workflowName}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <Badge variant={config.variant as any}>{config.label}</Badge>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
