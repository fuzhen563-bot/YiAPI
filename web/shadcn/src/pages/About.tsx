import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { Info } from 'lucide-react';

export default function About() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    api.get('/status').then((res) => {
      if (res.data.success) setStatus(res.data.data);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Info className="h-6 w-6" /> 关于</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>系统信息</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between"><span className="text-muted-foreground">系统名称</span><span>{status?.system_name || 'YiAPI'}</span></div>
          <Separator />
          <div className="flex justify-between"><span className="text-muted-foreground">版本</span><Badge variant="secondary">{status?.version || 'v0.0.0'}</Badge></div>
          <Separator />
          <div className="flex justify-between"><span className="text-muted-foreground">启动时间</span><span>{status?.start_time ? new Date(status.start_time * 1000).toLocaleString() : '-'}</span></div>
          <Separator />
          <div className="flex justify-between"><span className="text-muted-foreground">服务器地址</span><code className="text-xs">{status?.server_address || '-'}</code></div>
        </CardContent>
      </Card>
    </div>
  );
}
