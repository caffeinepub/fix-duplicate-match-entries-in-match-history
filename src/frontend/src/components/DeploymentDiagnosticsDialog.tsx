import { useState } from 'react';
import { Copy, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDeploymentDiagnostics } from '../hooks/useDeploymentDiagnostics';
import { getStepDescription, getSuggestions } from '../utils/deploymentErrorParser';
import { toast } from 'sonner';

interface DeploymentDiagnosticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeploymentDiagnosticsDialog({
  open,
  onOpenChange,
}: DeploymentDiagnosticsDialogProps) {
  const { diagnostics, clearDiagnostics } = useDeploymentDiagnostics();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!diagnostics) return;

    const textToCopy = `
Deployment Diagnostics Report
=============================

Failed Step: ${getStepDescription(diagnostics.step)}
Error Message: ${diagnostics.message}

Full Error:
${diagnostics.rawError}
    `.trim();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Error details copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleClear = () => {
    clearDiagnostics();
    toast.success('Diagnostics cleared');
    onOpenChange(false);
  };

  const getStepIcon = () => {
    if (!diagnostics) return <Info className="w-5 h-5" />;
    
    switch (diagnostics.step) {
      case 'build':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'deploy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStepBadgeVariant = () => {
    if (!diagnostics) return 'default';
    
    switch (diagnostics.step) {
      case 'build':
        return 'default';
      case 'deploy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStepIcon()}
            Deployment Diagnostics
          </DialogTitle>
          <DialogDescription>
            Detailed information about build and deployment failures
          </DialogDescription>
        </DialogHeader>

        {!diagnostics ? (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>No Error Information</AlertTitle>
            <AlertDescription>
              No deployment or build errors have been recorded. This diagnostics panel will display
              error details when a deployment failure occurs.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Full Error</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Failed Step</label>
                  <div className="mt-1">
                    <Badge variant={getStepBadgeVariant()} className="text-sm">
                      {getStepDescription(diagnostics.step)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Error Message</label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm font-mono break-words">{diagnostics.message}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1">
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Error Details
                      </>
                    )}
                  </Button>
                  <Button onClick={handleClear} variant="secondary">
                    Clear
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {diagnostics.rawError}
                </pre>
              </ScrollArea>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Full Error
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>Troubleshooting Steps</AlertTitle>
                <AlertDescription>
                  Based on the failure type, here are some suggestions to resolve the issue:
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {getSuggestions(diagnostics.step).map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Additional Resources:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Check the browser console for additional errors</li>
                  <li>Review the deployment logs in your terminal</li>
                  <li>Consult the Internet Computer documentation</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
