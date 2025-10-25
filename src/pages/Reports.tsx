import { FileText, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface Report {
  id: string;
  title: string;
  workflowName: string;
  generatedAt: string;
  findingsCount: number;
  severities: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

const mockReports: Report[] = [
  {
    id: 'rep1',
    title: 'Quick Recon - Security Assessment',
    workflowName: 'Quick Recon',
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    findingsCount: 8,
    severities: { low: 4, medium: 2, high: 2, critical: 0 },
  },
  {
    id: 'rep2',
    title: 'Deep Security Scan - Full Report',
    workflowName: 'Deep Security Scan',
    generatedAt: new Date(Date.now() - 86400000).toISOString(),
    findingsCount: 15,
    severities: { low: 6, medium: 5, high: 3, critical: 1 },
  },
  {
    id: 'rep3',
    title: 'API Endpoint Discovery Report',
    workflowName: 'API Endpoint Discovery',
    generatedAt: new Date(Date.now() - 172800000).toISOString(),
    findingsCount: 3,
    severities: { low: 2, medium: 1, high: 0, critical: 0 },
  },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsViewerOpen(true);
  };

  const handleDownload = (report: Report) => {
    toast.success(`Downloading ${report.title}.pdf`);
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">
          View and export generated security assessment reports
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockReports.map((report) => (
          <Card key={report.id} className="hover:border-primary/50 transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="h-8 w-8 text-primary mb-2" />
                <Badge variant="outline" className="text-xs">
                  {new Date(report.generatedAt).toLocaleDateString()}
                </Badge>
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription>{report.workflowName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Findings</span>
                  <span className="font-semibold">{report.findingsCount}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(report.severities).map(([severity, count]) =>
                    count > 0 ? (
                      <Badge key={severity} variant="outline" className="text-xs">
                        {severity}: {count}
                      </Badge>
                    ) : null
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewReport(report)}
                  >
                    <Eye className="h-3 w-3 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(report)}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This security assessment was conducted on {selectedReport && new Date(selectedReport.generatedAt).toLocaleDateString()}{' '}
                  as part of the <strong>{selectedReport?.workflowName}</strong> workflow.
                  A total of <strong>{selectedReport?.findingsCount} findings</strong> were identified
                  during the scan, including {selectedReport?.severities.critical} critical,{' '}
                  {selectedReport?.severities.high} high, {selectedReport?.severities.medium} medium,
                  and {selectedReport?.severities.low} low severity issues.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Findings Detail</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Badge variant="outline">high</Badge>
                      </TableCell>
                      <TableCell className="terminal-font text-sm">ssh</TableCell>
                      <TableCell className="terminal-font text-sm">22</TableCell>
                      <TableCell className="text-sm">Outdated OpenSSH version detected</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge variant="outline">low</Badge>
                      </TableCell>
                      <TableCell className="terminal-font text-sm">http</TableCell>
                      <TableCell className="terminal-font text-sm">80</TableCell>
                      <TableCell className="text-sm">HTTP service running without HTTPS redirect</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Badge variant="outline">medium</Badge>
                      </TableCell>
                      <TableCell className="terminal-font text-sm">https</TableCell>
                      <TableCell className="terminal-font text-sm">443</TableCell>
                      <TableCell className="text-sm">TLS certificate expires in 30 days</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Recommended Next Steps</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Update OpenSSH to the latest stable version to address known vulnerabilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Configure automatic HTTPS redirect for all HTTP traffic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Renew TLS certificate before expiration to prevent service disruption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Implement automated vulnerability scanning in CI/CD pipeline</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => selectedReport && handleDownload(selectedReport)} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
