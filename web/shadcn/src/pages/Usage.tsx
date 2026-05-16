import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';
import { useStatus } from '@/hooks/use-status';
import { formatQuota, renderQuota } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, MessageSquare, DollarSign, PiggyBank, Activity, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeRange = 'today' | 'week' | 'month' | 'cycle';

const ranges: { key: TimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'cycle', label: '当前周期' },
];

interface DashboardItem {
  Day: string; ModelName: string; RequestCount: number;
  Quota: number; PromptTokens: number; CompletionTokens: number;
}

export default function Usage() {
  const { status } = useStatus();
  const [range, setRange] = useState<TimeRange>('today');
  const [rawData, setRawData] = useState<DashboardItem[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const days = range === 'today' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 90;
    Promise.all([
      api.get('/user/dashboard'),
      api.get('/log/self/', { params: { p: 1 } }),
    ]).then(([dRes, lRes]) => {
      if (dRes.data.success) setRawData(Array.isArray(dRes.data.data) ? dRes.data.data : []);
      if (lRes.data.success) setLogs(lRes.data.data || []);
    }).finally(() => setLoading(false));
  }, [range]);

  // Filter by time range
  const now = new Date();
  const filtered = rawData.filter(d => {
    const itemDate = new Date(d.Day);
    const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / 86400000);
    if (range === 'today') return diffDays === 0;
    if (range === 'week') return diffDays < 7;
    if (range === 'month') return diffDays < 30;
    return diffDays < 90;
  });

  // Summary
  const totalPrompt = filtered.reduce((s, d) => s + (d.PromptTokens || 0), 0);
  const totalCompletion = filtered.reduce((s, d) => s + (d.CompletionTokens || 0), 0);
  const totalTokens = totalPrompt + totalCompletion;
  const totalQuota = filtered.reduce((s, d) => s + (d.Quota || 0), 0);
  const totalRequests = filtered.reduce((s, d) => s + (d.RequestCount || 0), 0);
  const displayInCurrency = status?.display_in_currency ?? true;
  const originalCost = displayInCurrency ? totalQuota : totalQuota;

  // Trend data
  const trendMap = new Map<string, { date: string; tokens: number; requests: number; cost: number }>();
  filtered.forEach(d => {
    const existing = trendMap.get(d.Day) || { date: d.Day, tokens: 0, requests: 0, cost: 0 };
    existing.tokens += (d.PromptTokens || 0) + (d.CompletionTokens || 0);
    existing.requests += d.RequestCount || 0;
    existing.cost += d.Quota || 0;
    trendMap.set(d.Day, existing);
  });
  const trendData = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Model ranking
  const modelMap = new Map<string, { name: string; tokens: number; requests: number; cost: number }>();
  filtered.forEach(d => {
    if (!d.ModelName) return;
    const existing = modelMap.get(d.ModelName) || { name: d.ModelName, tokens: 0, requests: 0, cost: 0 };
    existing.tokens += (d.PromptTokens || 0) + (d.CompletionTokens || 0);
    existing.requests += d.RequestCount || 0;
    existing.cost += d.Quota || 0;
    modelMap.set(d.ModelName, existing);
  });
  const modelRanking = Array.from(modelMap.values()).sort((a, b) => b.cost - a.cost).slice(0, 10);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" /> 用量统计
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Usage Analytics</p>
        </div>
        {/* Time filter */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {ranges.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                range === r.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >{r.label}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Prompt</p>
          <p className="text-lg font-bold">{totalPrompt.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> Completion</p>
          <p className="text-lg font-bold">{totalCompletion.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> 原价</p>
          <p className="text-lg font-bold">¥{formatQuota(originalCost)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><PiggyBank className="h-3 w-3" /> 实际支付</p>
          <p className="text-lg font-bold">¥{formatQuota(totalQuota)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> 请求数</p>
          <p className="text-lg font-bold">{totalRequests.toLocaleString()}</p>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3"><CardTitle className="text-sm">Token 趋势</CardTitle></CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3"><CardTitle className="text-sm">请求趋势</CardTitle></CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Consumption Ranking */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3"><CardTitle className="text-sm">模型消耗排行</CardTitle></CardHeader>
        <CardContent className="px-2 sm:px-6">
          {modelRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {modelRanking.map((m, i) => {
                const maxCost = modelRanking[0]?.cost || 1;
                const pct = (m.cost / maxCost) * 100;
                return (
                  <div key={m.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <Badge variant="secondary" className="text-xs font-mono">{m.name}</Badge>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{(m.tokens / 1000).toFixed(0)}K tokens</span>
                        <span className="font-medium text-foreground">¥{formatQuota(m.cost)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3"><CardTitle className="text-sm">最近请求</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={[
              { key: 'created_at', label: '时间', render: (l) => new Date(l.created_at * 1000).toLocaleString(), hideOnMobile: true },
              { key: 'model_name', label: '模型', render: (l) => <Badge variant="secondary" className="text-xs">{l.model_name}</Badge> },
              { key: 'prompt_tokens', label: 'Prompt' },
              { key: 'completion_tokens', label: 'Completion' },
              { key: 'quota', label: '消费', render: (l) => `¥${(l.quota / 1000000).toFixed(4)}` },
            ]}
            data={logs.slice(0, 10)}
            loading={false}
            page={1}
            total={Math.min(logs.length, 10)}
            onPageChange={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
}
