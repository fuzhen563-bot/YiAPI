import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Channel {
  id: number; name: string; type: number; status: number;
  models: string; response_time?: number; priority: number; weight: number;
}

const channelTypes: Record<number, string> = {
  1:'OpenAI', 3:'Azure', 14:'Anthropic', 15:'百度', 17:'阿里',
  24:'Gemini', 28:'Mistral', 33:'AWS', 50:'OpenAI兼容', 40:'字节',
  8:'智谱', 7:'讯飞', 5:'ChatGLM',
};

export default function AdminChannelHealth() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/channel/', { params: { p: 1 } }).then((res) => {
      if (res.data.success) setChannels(res.data.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const testChannel = async (id: number) => {
    setTesting(id);
    try {
      const res = await api.get(`/channel/test/${id}`, { params: { model: 'gpt-3.5-turbo' } });
      toast.success(res.data.success ? '测试通过' : `测试失败: ${res.data.message}`);
      load();
    } catch { toast.error('测试请求失败') }
    finally { setTesting(null) }
  };

  const testAll = async () => {
    setLoading(true);
    try {
      await api.get('/channel/test', { params: { scope: 'all' } });
      toast.success('批量测试完成');
      load();
    } catch { toast.error('批量测试失败') }
  };

  const healthy = channels.filter(c => c.status === 1).length;
  const warning = channels.filter(c => c.status === 2).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-5 w-5 sm:h-6 sm:w-6" /> 渠道健康
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={testAll} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> 批量测试
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">总渠道</p><p className="text-xl font-bold">{channels.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">正常</p><p className="text-xl font-bold text-green-600">{healthy}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">告警</p><p className="text-xl font-bold text-amber-600">{warning}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">成功率</p><p className="text-xl font-bold">--</p></CardContent></Card>
      </div>

      {/* Channel List */}
      <Card>
        <CardContent className="p-0 sm:p-6">
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <div className="space-y-2">
              {channels.map(ch => (
                <div key={ch.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {ch.status === 1 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    ) : ch.status === 2 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ch.name}</span>
                        <Badge variant="outline" className="text-[10px]">{channelTypes[ch.type] || `类型${ch.type}`}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{ch.models?.substring(0, 60)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs text-muted-foreground hidden sm:block">
                      <p>权重 {ch.weight}</p>
                      <p>优先级 {ch.priority}</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs"
                      onClick={() => testChannel(ch.id)} disabled={testing === ch.id}>
                      {testing === ch.id ? '测试中...' : '测试'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
