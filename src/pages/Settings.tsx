import { useEffect, useState } from 'react';
import { Download, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSettings, saveSettings, setTheme } from '@/store/slices/settingsSlice';
import { toast } from 'sonner';
import { api } from '@/api/client';

export default function Settings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [discordEnabled, setDiscordEnabled] = useState(false);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings.integrations.slack) {
      setSlackWebhook(settings.integrations.slack.webhookUrl);
      setSlackEnabled(settings.integrations.slack.enabled);
    }
    if (settings.integrations.discord) {
      setDiscordWebhook(settings.integrations.discord.webhookUrl);
      setDiscordEnabled(settings.integrations.discord.enabled);
    }
  }, [settings.integrations]);

  const handleSaveIntegrations = async () => {
    const newSettings = {
      ...settings,
      integrations: {
        slack: slackWebhook
          ? {
              type: 'slack' as const,
              webhookUrl: slackWebhook,
              enabled: slackEnabled,
            }
          : undefined,
        discord: discordWebhook
          ? {
              type: 'discord' as const,
              webhookUrl: discordWebhook,
              enabled: discordEnabled,
            }
          : undefined,
      },
    };

    await dispatch(saveSettings(newSettings));
    toast.success('Integration settings saved');
  };

  const handleThemeToggle = (checked: boolean) => {
    dispatch(setTheme(checked ? 'dark' : 'light'));
  };

  const handleExportWorkflows = async () => {
    const blob = await api.exportWorkflows();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipsec-workflows-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Workflows exported');
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and integrations</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Configure webhook integrations for alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="slack-enabled" className="text-base">
                    Slack Integration
                  </Label>
                  <p className="text-sm text-muted-foreground">Send alerts to Slack channels</p>
                </div>
                <Switch
                  id="slack-enabled"
                  checked={slackEnabled}
                  onCheckedChange={setSlackEnabled}
                />
              </div>
              {slackEnabled && (
                <div>
                  <Label htmlFor="slack-webhook">Webhook URL</Label>
                  <Input
                    id="slack-webhook"
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    className="terminal-font mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Get your webhook URL from Slack's Incoming Webhooks app
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="discord-enabled" className="text-base">
                    Discord Integration
                  </Label>
                  <p className="text-sm text-muted-foreground">Send alerts to Discord channels</p>
                </div>
                <Switch
                  id="discord-enabled"
                  checked={discordEnabled}
                  onCheckedChange={setDiscordEnabled}
                />
              </div>
              {discordEnabled && (
                <div>
                  <Label htmlFor="discord-webhook">Webhook URL</Label>
                  <Input
                    id="discord-webhook"
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    className="terminal-font mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Create a webhook in your Discord server's channel settings
                  </p>
                </div>
              )}
            </div>

            <Button onClick={handleSaveIntegrations}>
              <Save className="h-4 w-4 mr-2" />
              Save Integration Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode" className="text-base">
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for better visibility in low light
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={settings.theme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Download your workflows and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportWorkflows} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Workflows (JSON)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legal & Compliance</CardTitle>
            <CardDescription>Important information about authorized use</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Authorized Use Notice:</strong> This tool is intended for authorized security
                testing only. You must have explicit permission to scan any target system. Unauthorized
                scanning may be illegal in your jurisdiction. Always verify that you have proper
                authorization before running any reconnaissance or security testing workflows.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
