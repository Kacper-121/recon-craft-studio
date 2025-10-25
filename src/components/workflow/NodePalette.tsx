import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { nodeDefinitions, getCategoryColor } from '@/lib/nodeDefinitions';
import { NodeKind, NodeCategory } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface NodePaletteProps {
  onNodeDragStart: (nodeKind: NodeKind, event: React.DragEvent) => void;
}

const categories: { key: NodeCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'recon', label: 'Recon' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'security', label: 'Security' },
  { key: 'output', label: 'Output' },
  { key: 'utilities', label: 'Utilities' },
];

export function NodePalette({ onNodeDragStart }: NodePaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'all'>('all');

  const filtered = Object.values(nodeDefinitions).filter((node) => {
    const matchSearch =
      node.label.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'all' || node.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex h-full flex-col bg-card border-r">
      <div className="p-4 border-b bg-background/80 backdrop-blur">
        <h3 className="font-semibold mb-3 text-sm tracking-tight">Node Palette</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-3 border-b bg-background/50">
        {categories.map((cat) => (
          <Badge
            key={cat.key}
            variant={selectedCategory === cat.key ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.key)}
            className="cursor-pointer text-xs"
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-muted-foreground text-xs text-center py-6">
              No matching nodes
            </div>
          )}
          {filtered.map((node) => {
            const Icon = node.icon;
            return (
              <div
                key={node.kind}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', node.kind);
                  onNodeDragStart(node.kind, e);
                }}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-md border bg-background hover:bg-accent cursor-grab transition-all',
                  'hover:shadow-md active:cursor-grabbing'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md shrink-0',
                    getCategoryColor(node.category)
                  )}
                >
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{node.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {node.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
