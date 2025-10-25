import { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  useGetTargetsQuery,
  useCreateTargetMutation,
  useBulkImportTargetsMutation,
  useDeleteTargetMutation,
} from '@/api/reconCraftApi';

export default function Targets() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [newTags, setNewTags] = useState('');
  const [bulkTargets, setBulkTargets] = useState('');

  // RTK Query hooks
  const { data: targets = [], isLoading: loadingTargets } = useGetTargetsQuery();
  const [createTarget] = useCreateTargetMutation();
  const [bulkImport] = useBulkImportTargetsMutation();
  const [deleteTarget] = useDeleteTargetMutation();

  const handleAddTarget = async () => {
    if (!newTarget.trim()) {
      toast.error('Please enter a target');
      return;
    }

    try {
      const tags = newTags.split(',').map((t) => t.trim()).filter(Boolean);
      await createTarget({ value: newTarget, tags }).unwrap();

      setNewTarget('');
      setNewTags('');
      setIsAddDialogOpen(false);
      toast.success('Target added');
    } catch (error: any) {
      toast.error(`Failed to add target: ${error.message || 'Unknown error'}`);
      console.error('Add target error:', error);
    }
  };

  const handleBulkImport = async () => {
    const targetList = bulkTargets.split('\n').map((t) => t.trim()).filter(Boolean);

    if (targetList.length === 0) {
      toast.error('Please enter at least one target');
      return;
    }

    try {
      await bulkImport({ targets: targetList }).unwrap();
      setBulkTargets('');
      setIsBulkDialogOpen(false);
      toast.success(`Imported ${targetList.length} target(s)`);
    } catch (error: any) {
      toast.error(`Failed to import targets: ${error.message || 'Unknown error'}`);
      console.error('Bulk import error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTarget(id).unwrap();
      toast.success('Target deleted');
    } catch (error: any) {
      toast.error(`Failed to delete target: ${error.message || 'Unknown error'}`);
      console.error('Delete target error:', error);
    }
  };

  const isValidTarget = (value: string): boolean => {
    // Simple validation for IP, CIDR, hostname
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
    return ipRegex.test(value) || hostnameRegex.test(value);
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Authorized Targets</h1>
          <p className="text-muted-foreground">
            Manage your authorized scan targets (IPs, CIDRs, hostnames)
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Import Targets</DialogTitle>
                <DialogDescription>
                  Enter one target per line (IP addresses, CIDR ranges, or hostnames)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="10.0.2.3&#10;192.168.1.0/24&#10;example.com"
                  value={bulkTargets}
                  onChange={(e) => setBulkTargets(e.target.value)}
                  rows={10}
                  className="terminal-font"
                />
                <Button onClick={handleBulkImport} className="w-full">
                  Import Targets
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Target
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Target</DialogTitle>
                <DialogDescription>
                  Add an authorized target for scanning (IP, CIDR, or hostname)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    placeholder="e.g., 10.0.2.3, 192.168.1.0/24, example.com"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="terminal-font"
                  />
                  {newTarget && (
                    <div className="mt-2">
                      <Badge variant={isValidTarget(newTarget) ? 'default' : 'destructive'}>
                        {isValidTarget(newTarget) ? 'Valid' : 'Invalid format'}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., demo, staging, production"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddTarget} className="w-full" disabled={!isValidTarget(newTarget)}>
                  Add Target
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target List</CardTitle>
          <CardDescription>
            {targets.length} authorized target(s) • Only scan assets you have permission to test
          </CardDescription>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No targets configured yet</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>Add Your First Target</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell className="terminal-font font-medium">{target.value}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {target.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(target.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(target.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
