import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { nodeDefinitions, getCategoryColor } from '@/lib/nodeDefinitions';
import { NodeKind, NodeCategory } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface NodePaletteProps {
  onNodeDragStart: (nodeKind: NodeKind) => void;
}

const categories: { key: NodeCategory; label: string }[] = [
  { key: 'recon', label: 'Recon' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'security', label: 'Security' },
  { key: 'output', label: 'Output' },
  { key: 'utilities', label: 'Utilities' },
];

export function NodePalette({ onNodeDragStart }: NodePaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'all'>('all');

  const filteredNodes = Object.values(nodeDefinitions).filter((node) => {
    const matchesSearch =
      node.label.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Node Palette</h3>
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

      <div className="flex flex-wrap gap-1 p-3 border-b">
        <Badge
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          className="cursor-pointer transition-smooth"
          onClick={() => setSelectedCategory('all')}
        >
          All
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat.key}
            variant={selectedCategory === cat.key ? 'default' : 'outline'}
            className="cursor-pointer transition-smooth"
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredNodes.map((node) => {
            const Icon = node.icon;
            return (
              <div
                key={node.kind}
                draggable
                onDragStart={() => onNodeDragStart(node.kind)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-move transition-smooth hover:shadow-md',
                  getCategoryColor(node.category)
                )}
              >
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{node.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">{node.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
