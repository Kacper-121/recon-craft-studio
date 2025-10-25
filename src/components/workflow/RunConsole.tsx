import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Copy, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RunConsoleProps {
  logs: string[];
  artifacts?: string[];
  jsonOutput?: any;
  isRunning?: boolean;
}

export function RunConsole({ logs, artifacts = [], jsonOutput, isRunning = false }: RunConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div
      className={cn(
        'border-t bg-card transition-all',
        isExpanded ? 'h-80' : 'h-12'
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm">Run Console</h3>
          {isRunning && (
            <Badge variant="default" className="animate-pulse">
              Running
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          >
            {autoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <Tabs defaultValue="logs" className="h-[calc(100%-3rem)]">
          <div className="border-b px-4">
            <TabsList className="h-9">
              <TabsTrigger value="logs" className="text-xs">
                Logs ({logs.length})
              </TabsTrigger>
              <TabsTrigger value="artifacts" className="text-xs">
                Artifacts ({artifacts.length})
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs">
                JSON Output
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="logs" className="h-[calc(100%-2.25rem)] m-0 p-0">
            <div className="relative h-full">
              <ScrollArea className="h-full" ref={scrollRef}>
                <div className="p-4 space-y-1 terminal-font text-xs">
                  {logs.length === 0 ? (
                    <div className="text-muted-foreground">No logs yet</div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="text-foreground/90">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-4 right-4"
                onClick={() => copyToClipboard(logs.join('\n'))}
              >
                <Copy className="h-3 w-3 mr-2" />
                Copy All
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="artifacts" className="h-[calc(100%-2.25rem)] m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {artifacts.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No artifacts generated</div>
                ) : (
                  artifacts.map((artifact, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                    >
                      <span className="terminal-font text-sm">{artifact}</span>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="json" className="h-[calc(100%-2.25rem)] m-0 p-0">
            <div className="relative h-full">
              <ScrollArea className="h-full">
                <pre className="p-4 terminal-font text-xs text-foreground/90">
                  {jsonOutput ? JSON.stringify(jsonOutput, null, 2) : 'No output data'}
                </pre>
              </ScrollArea>
              {jsonOutput && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-4 right-4"
                  onClick={() => copyToClipboard(JSON.stringify(jsonOutput, null, 2))}
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy JSON
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
