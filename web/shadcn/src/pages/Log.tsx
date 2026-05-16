import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { useUser } from '@/hooks/use-auth';
import { ScrollText } from 'lucide-react';

interface LogEntry {
  id: number; created_time: number; username: string; model_name: string;
  prompt_tokens: number; completion_tokens: number; quota: number;
  channel_name: string; content: string; type: number;
}

export default function Log() {
  const { user } = useUser();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const ep = user?.role === 1 ? '/log/' : '/log/self/';
      const res = await api.get(ep, { params: { p } });
      if (res.data.success) { setLogs(res.data.data || []); setTotal(res.data.total || 0) }
    } catch { toast.error('加载日志失败') }
    finally { setLoading(false) }
  }, [user]);

  useEffect(() => { load(page) }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ScrollText className="h-6 w-6" /> 日志</h1>
        <p className="text-sm text-muted-foreground">查看 API 调用记录</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={[
              { key: 'created_time', label: '时间', render: (l) => new Date(l.created_time * 1000).toLocaleString() },
              { key: 'username', label: '用户' },
              { key: 'model_name', label: '模型', render: (l) => <Badge variant="secondary">{l.model_name}</Badge> },
              { key: 'prompt_tokens', label: '输入' },
              { key: 'completion_tokens', label: '输出' },
              { key: 'quota', label: '消费', render: (l) => `¥${(l.quota / 1000000).toFixed(4)}` },
              { key: 'channel_name', label: '渠道', render: (l) => l.channel_name || '-' },
            ]}
            data={logs}
            loading={loading}
            page={page}
            total={total}
            onPageChange={setPage}
            searchPlaceholder="搜索模型名称..."
            onSearch={(kw) => {
              const ep = user?.role === 1 ? '/log/search' : '/log/self/search';
              api.get(ep, { params: { keyword: kw } }).then(r => {
                if (r.data.success) { setLogs(r.data.data); setTotal(r.data.data?.length || 0) }
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
