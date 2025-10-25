import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRuns, fetchRun } from '@/store/slices/runsSlice';
import { Run, RunStatus } from '@/types/workflow';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const statusConfig: Record<RunStatus, { icon: any; variant: string; label: string }> = {
  queued: { icon: Clock, variant: 'secondary', label: 'Queued' },
  running: { icon: Play, variant: 'default', label: 'Running' },
  succeeded: { icon: CheckCircle2, variant: 'default', label: 'Succeeded' },
  failed: { icon: XCircle, variant: 'destructive', label: 'Failed' },
};

export default function Runs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { runs, currentRun } = useAppSelector((state) => state.runs);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchRuns());
  }, [dispatch]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      dispatch(fetchRun(id));
      setIsSheetOpen(true);
    }
  }, [searchParams, dispatch]);

  const handleRowClick = (run: Run) => {
    setSearchParams({ id: run.id });
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSearchParams({});
  };

  const handleSendToSlack = () => {
    toast.success('Alert sent to Slack');
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workflow Runs</h1>
        <p className="text-muted-foreground">View and manage workflow execution history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Runs</CardTitle>
          <CardDescription>Click on a run to view detailed logs and findings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run ID</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Started</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const config = statusConfig[run.status];
                const StatusIcon = config.icon;
                return (
                  <TableRow
                    key={run.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => handleRowClick(run)}
                  >
                    <TableCell className="terminal-font text-sm">{run.id}</TableCell>
                    <TableCell className="font-medium">{run.workflowName}</TableCell>
                    <TableCell>
                      <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.duration ? `${run.duration}s` : '-'}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="w-full sm:max-w-2xl">
          {currentRun && (
            <>
              <SheetHeader>
                <SheetTitle>{currentRun.workflowName}</SheetTitle>
                <SheetDescription>
                  Run ID: <span className="terminal-font">{currentRun.id}</span>
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Overview</h3>
                    <div className="grid gap-3">
                      <div className="flex justify-between items-center p-3 rounded-lg border bg-background">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={statusConfig[currentRun.status].variant as any}>
                          {statusConfig[currentRun.status].label}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg border bg-background">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="font-medium">{currentRun.duration || '-'}s</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg border bg-background">
                        <span className="text-sm text-muted-foreground">Started</span>
                        <span className="font-medium">
                          {formatDistanceToNow(new Date(currentRun.startedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {currentRun.summary && (
                    <div>
                      <h3 className="font-semibold mb-3">Findings Summary</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border bg-background">
                          <div className="text-2xl font-bold">{currentRun.summary.findingsCount}</div>
                          <div className="text-xs text-muted-foreground mt-1">Total Findings</div>
                        </div>
                        <div className="p-3 rounded-lg border bg-background">
                          <div className="text-2xl font-bold text-destructive">
                            {currentRun.summary.severities.high + currentRun.summary.severities.critical}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">High/Critical</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {Object.entries(currentRun.summary.severities).map(([severity, count]) => (
                          <Badge key={severity} variant="outline">
                            {severity}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-3">Execution Steps</h3>
                    <div className="space-y-3">
                      {currentRun.steps.map((step, i) => {
                        const config = statusConfig[step.status];
                        const StepIcon = config.icon;
                        return (
                          <div key={i} className="border rounded-lg p-4 bg-background">
                            <div className="flex items-center gap-2 mb-2">
                              <StepIcon className="h-4 w-4" />
                              <span className="font-medium">{step.name}</span>
                              <Badge variant={config.variant as any} className="ml-auto">
                                {config.label}
                              </Badge>
                            </div>
                            {step.logs.length > 0 && (
                              <div className="mt-3 p-3 rounded bg-muted terminal-font text-xs space-y-1">
                                {step.logs.map((log, j) => (
                                  <div key={j}>{log}</div>
                                ))}
                              </div>
                            )}
                            {step.findings && step.findings.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {step.findings.map((finding) => (
                                  <div key={finding.id} className="p-2 rounded border-l-2 border-warning bg-muted/50">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">{finding.severity}</Badge>
                                      <span className="text-sm font-medium">{finding.title}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{finding.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSendToSlack} className="flex-1">
                      Send to Slack
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Export Report
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
