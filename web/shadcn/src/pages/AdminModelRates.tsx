import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Cpu, Save, Search, Gauge } from 'lucide-react';

export default function AdminModelRates() {
  const [options, setOptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.get('/option/').then((res) => {
      if (res.data.success) {
        const map: Record<string, string> = {};
        (res.data.data || []).forEach((o: any) => { map[o.key] = o.value });
        setOptions(map);
      }
    }).finally(() => setLoading(false));
  }, []);

  const updateRate = async (key: string, value: string) => {
    setSaving(key);
    try {
      await api.put('/option/', { key, value });
      setOptions(p => ({ ...p, [key]: value }));
      toast.success('已更新');
    } catch { toast.error('更新失败') }
    finally { setSaving(null) }
  };

  const modelGroups = [
    {
      label: 'OpenAI',
      models: [
        { label: 'GPT-4o', promptKey: 'gpt-4o', completionKey: 'gpt-4o-completion' },
        { label: 'GPT-4o-mini', promptKey: 'gpt-4o-mini', completionKey: 'gpt-4o-mini-completion' },
        { label: 'GPT-3.5 Turbo', promptKey: 'gpt-3.5-turbo', completionKey: 'gpt-3.5-turbo-completion' },
        { label: 'o1', promptKey: 'o1', completionKey: 'o1-completion' },
        { label: 'o3-mini', promptKey: 'o3-mini', completionKey: 'o3-mini-completion' },
      ],
    },
    {
      label: 'Anthropic',
      models: [
        { label: 'Claude 3.5 Sonnet', promptKey: 'claude-3-5-sonnet', completionKey: 'claude-3-5-sonnet-completion' },
        { label: 'Claude 3 Haiku', promptKey: 'claude-3-haiku', completionKey: 'claude-3-haiku-completion' },
        { label: 'Claude 3 Opus', promptKey: 'claude-3-opus', completionKey: 'claude-3-opus-completion' },
      ],
    },
    {
      label: 'DeepSeek & Others',
      models: [
        { label: 'DeepSeek Chat', promptKey: 'deepseek-chat', completionKey: 'deepseek-chat-completion' },
        { label: 'DeepSeek Reasoner', promptKey: 'deepseek-reasoner', completionKey: 'deepseek-reasoner-completion' },
        { label: 'Gemini Pro', promptKey: 'gemini-pro', completionKey: 'gemini-pro-completion' },
        { label: 'Gemini Flash', promptKey: 'gemini-flash', completionKey: 'gemini-flash-completion' },
      ],
    },
  ];

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Gauge className="h-5 w-5 sm:h-6 sm:w-6" /> 模型倍率配置
        </h1>
      </div>

      {modelGroups.map(group => (
        <Card key={group.label}>
          <CardHeader><CardTitle className="text-base">{group.label}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {group.models.map(m => (
              <div key={m.promptKey}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="sm:w-40">
                    <p className="text-sm font-medium">{m.label}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs text-muted-foreground w-16">输入倍率</label>
                    <Input value={options[m.promptKey] || '1'}
                      onChange={(e) => setOptions(p => ({ ...p, [m.promptKey]: e.target.value }))}
                      className="w-20 h-8 text-sm" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs text-muted-foreground w-16">输出倍率</label>
                    <Input value={options[m.completionKey] || '1'}
                      onChange={(e) => setOptions(p => ({ ...p, [m.completionKey]: e.target.value }))}
                      className="w-20 h-8 text-sm" />
                  </div>
                  <Button variant="outline" size="sm" className="h-8 shrink-0"
                    onClick={async () => {
                      await updateRate(m.promptKey, options[m.promptKey] || '1');
                      await updateRate(m.completionKey, options[m.completionKey] || '1');
                    }}
                    disabled={saving === m.promptKey}>
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
