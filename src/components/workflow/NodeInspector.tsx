import { WorkflowNode } from '@/types/workflow';
import { nodeDefinitions } from '@/lib/nodeDefinitions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';

interface NodeInspectorProps {
  node: WorkflowNode | null;
  onUpdate: (nodeId: string, config: Record<string, any>) => void;
  onClose: () => void;
}

export function NodeInspector({ node, onUpdate, onClose }: NodeInspectorProps) {
  const [config, setConfig] = useState(node?.config || {});

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
        <div>
          <p className="text-sm">Select a node to configure</p>
        </div>
      </div>
    );
  }

  const definition = nodeDefinitions[node.kind];
  const Icon = definition.icon;

  const handleConfigChange = (field: string, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
  };

  const handleSave = () => {
    onUpdate(node.id, config);
  };

  return (
    <div className="flex h-full flex-col border-l bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h3 className="font-semibold">{node.label}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="node-label">Node Label</Label>
            <Input
              id="node-label"
              value={node.label}
              onChange={(e) => onUpdate(node.id, { ...config, label: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Category</Label>
            <Badge className="mt-1.5">{definition.category}</Badge>
          </div>

          {definition.configSchema.map((schema) => (
            <div key={schema.field}>
              <Label htmlFor={schema.field}>{schema.label}</Label>
              {schema.type === 'text' && (
                <Input
                  id={schema.field}
                  value={config[schema.field] || ''}
                  onChange={(e) => handleConfigChange(schema.field, e.target.value)}
                  placeholder={schema.placeholder}
                  className="mt-1.5"
                />
              )}
              {schema.type === 'textarea' && (
                <Textarea
                  id={schema.field}
                  value={config[schema.field] || ''}
                  onChange={(e) => handleConfigChange(schema.field, e.target.value)}
                  placeholder={schema.placeholder}
                  rows={4}
                  className="mt-1.5 terminal-font text-sm"
                />
              )}
              {schema.type === 'select' && (
                <Select
                  value={config[schema.field] || ''}
                  onValueChange={(value) => handleConfigChange(schema.field, value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    {schema.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {schema.type === 'checkbox' && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Checkbox
                    id={schema.field}
                    checked={config[schema.field] || false}
                    onCheckedChange={(checked) => handleConfigChange(schema.field, checked)}
                  />
                  <Label htmlFor={schema.field} className="cursor-pointer">
                    {schema.label}
                  </Label>
                </div>
              )}
              {schema.type === 'array' && schema.field === 'targets' && (
                <div className="mt-1.5">
                  <Textarea
                    value={Array.isArray(config[schema.field]) ? config[schema.field].join('\n') : ''}
                    onChange={(e) =>
                      handleConfigChange(
                        schema.field,
                        e.target.value.split('\n').filter((t) => t.trim())
                      )
                    }
                    placeholder={schema.placeholder}
                    rows={3}
                    className="terminal-font text-sm"
                  />
                </div>
              )}
              {schema.type === 'array' && schema.field === 'rules' && node.kind === 'parser' && (
                <div className="mt-1.5 space-y-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(config[schema.field] || []).map((rule: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="terminal-font text-xs">{rule.service}</TableCell>
                          <TableCell className="terminal-font text-xs">{rule.version}</TableCell>
                          <TableCell className="text-xs">{rule.note}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {rule.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                const newRules = [...(config[schema.field] || [])];
                                newRules.splice(i, 1);
                                handleConfigChange(schema.field, newRules);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const newRule = {
                        service: 'ssh',
                        version: '*',
                        note: 'Service detected',
                        severity: 'low',
                      };
                      handleConfigChange(schema.field, [...(config[schema.field] || []), newRule]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              )}
              {schema.type === 'array' && schema.field === 'includeSections' && (
                <div className="mt-1.5 space-y-2">
                  {['summary', 'findings', 'recommendations', 'raw-data'].map((section) => (
                    <div key={section} className="flex items-center gap-2">
                      <Checkbox
                        id={`section-${section}`}
                        checked={(config[schema.field] || []).includes(section)}
                        onCheckedChange={(checked) => {
                          const current = config[schema.field] || [];
                          const updated = checked
                            ? [...current, section]
                            : current.filter((s: string) => s !== section);
                          handleConfigChange(schema.field, updated);
                        }}
                      />
                      <Label htmlFor={`section-${section}`} className="cursor-pointer capitalize">
                        {section.replace('-', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4 flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          Apply Changes
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
