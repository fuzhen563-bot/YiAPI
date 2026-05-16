import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Cpu, Save, Search } from 'lucide-react';

interface Model {
  id: string; object: string; created: number; owned_by: string;
}

export default function AdminModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.get('/models'),
      api.get('/option/'),
    ]).then(([mRes, oRes]) => {
      if (mRes.data.success) setModels(Array.isArray(mRes.data.data) ? mRes.data.data : []);
      if (oRes.data.success) {
        const map: Record<string, string> = {};
        (oRes.data.data || []).forEach((o: any) => { map[o.key] = o.value });
        setOptions(map);
      }
    }).finally(() => setLoading(false));
  }, []);

  const filtered = models.filter(m => m.id?.toLowerCase().includes(search.toLowerCase()));

  const modelRateKeys = [
    { label: 'GPT-4o', key: 'gpt-4o' },
    { label: 'GPT-4o-mini', key: 'gpt-4o-mini' },
    { label: 'GPT-3.5', key: 'gpt-3.5-turbo' },
    { label: 'Claude 3.5 Sonnet', key: 'claude-3-5-sonnet' },
    { label: 'Claude 3 Haiku', key: 'claude-3-haiku' },
    { label: 'DeepSeek V3', key: 'deepseek-chat' },
    { label: 'DeepSeek R1', key: 'deepseek-reasoner' },
    { label: 'Gemini Pro', key: 'gemini-pro' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Cpu className="h-5 w-5 sm:h-6 sm:w-6" /> 模型管理
        </h1>
      </div>

      {/* Model list */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索模型..." className="pl-9" />
            </div>
            <Badge variant="secondary">{filtered.length} 个模型</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <div className="flex flex-wrap gap-2">
              {filtered.map(m => (
                <Badge key={m.id} variant="outline" className="px-3 py-1.5 text-sm">{m.id}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Rate Config */}
      <Card>
        <CardHeader><CardTitle className="text-base">模型倍率配置</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {modelRateKeys.map(r => {
            const promptKey = `rate-${r.key}`;
            const completionKey = `completion-rate-${r.key}`;
            return (
              <div key={r.key}>
                <p className="text-sm font-medium mb-2">{r.label}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">输入倍率</label>
                    <Input value={options[promptKey] || '1'} onChange={(e) => setOptions(p => ({ ...p, [promptKey]: e.target.value }))}
                      className="w-20 h-8 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">输出倍率</label>
                    <Input value={options[completionKey] || '1'} onChange={(e) => setOptions(p => ({ ...p, [completionKey]: e.target.value }))}
                      className="w-20 h-8 text-sm" />
                  </div>
                  <Button variant="outline" size="sm" onClick={async () => {
                    await api.put('/option/', { key: promptKey, value: options[promptKey] || '1' });
                    await api.put('/option/', { key: completionKey, value: options[completionKey] || '1' });
                    toast.success('已更新');
                  }}>
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Separator className="mt-3" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
