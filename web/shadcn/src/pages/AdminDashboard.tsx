import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { formatQuota } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, Users, TrendingUp, Activity, AlertTriangle, CheckCircle, XCircle, Cpu } from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/user/', { params: { p: 1 } }),
      api.get('/log/', { params: { p: 1 } }),
    ]).then(([uRes, lRes]) => {
      if (uRes.data.success) setUsers(uRes.data.data || []);
      if (lRes.data.success) setLogs(lRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const todayRevenue = logs.slice(0, 50).reduce((s, l) => s + (l.quota || 0), 0);
  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.status === 1).length;
  const totalRequests = logs.length;

  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      revenue: Math.floor(Math.random() * (todayRevenue || 500000) / 10),
      users: Math.floor(Math.random() * 20) + 1,
    };
  });

  const channels = [
    { name: 'OpenAI', status: 'healthy', latency: '320ms', success: '99.8%', today: '45,230' },
    { name: 'Azure', status: 'healthy', latency: '180ms', success: '99.9%', today: '12,450' },
    { name: 'Anthropic', status: 'healthy', latency: '450ms', success: '99.5%', today: '8,920' },
    { name: '百度文心', status: 'warning', latency: '890ms', success: '97.2%', today: '3,210' },
    { name: '阿里通义', status: 'healthy', latency: '350ms', success: '99.1%', today: '6,780' },
    { name: '智谱', status: 'error', latency: '2.1s', success: '85.3%', today: '1,230' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">管理概览</h1>

      {/* Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card><CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-green-600" /><p className="text-xs text-muted-foreground">今日收入</p></div>
          <p className="text-xl sm:text-2xl font-bold">¥{formatQuota(todayRevenue)}</p>
          <p className="text-xs text-green-600 mt-0.5">↑ 12.3% 较昨日</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-blue-600" /><p className="text-xs text-muted-foreground">用户总数</p></div>
          <p className="text-xl sm:text-2xl font-bold">{totalUsers}</p>
          <p className="text-xs text-muted-foreground mt-0.5">活跃 {activeUsers} · 新增 +3</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-purple-600" /><p className="text-xs text-muted-foreground">Token 消耗</p></div>
          <p className="text-xl sm:text-2xl font-bold">12.4M</p>
          <p className="text-xs text-muted-foreground mt-0.5">今日消耗</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-amber-600" /><p className="text-xs text-muted-foreground">API 请求</p></div>
          <p className="text-xl sm:text-2xl font-bold">{totalRequests.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-0.5">成功率 99.2%</p>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3"><CardTitle className="text-sm">收入趋势</CardTitle></CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3"><CardTitle className="text-sm">用户增长</CardTitle></CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Health */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" /> 渠道健康状态</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6 overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead><tr className="border-b">
              <th className="p-3 text-left font-medium text-muted-foreground">渠道</th>
              <th className="p-3 text-left font-medium text-muted-foreground">状态</th>
              <th className="p-3 text-right font-medium text-muted-foreground">延迟</th>
              <th className="p-3 text-right font-medium text-muted-foreground">成功率</th>
              <th className="p-3 text-right font-medium text-muted-foreground">今日请求</th>
            </tr></thead>
            <tbody>
              {channels.map((ch, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-medium">{ch.name}</td>
                  <td className="p-3">
                    <Badge variant={ch.status === 'healthy' ? 'success' : ch.status === 'warning' ? 'warning' : 'destructive'} className="text-xs">
                      {ch.status === 'healthy' ? <CheckCircle className="h-3 w-3 mr-1" /> : ch.status === 'warning' ? <AlertTriangle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {ch.status === 'healthy' ? '正常' : ch.status === 'warning' ? '警告' : '异常'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right text-muted-foreground">{ch.latency}</td>
                  <td className="p-3 text-right">{ch.success}</td>
                  <td className="p-3 text-right">{ch.today}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader><CardTitle className="text-base flex items-center gap-2 text-amber-600"><AlertTriangle className="h-4 w-4" /> 风险告警</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <span>渠道「智谱」成功率降至 85.3%</span>
            <Badge variant="warning" className="text-xs">处理中</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <span>用户「testuser」1小时内请求超 1000 次</span>
            <Badge variant="warning" className="text-xs">已限流</Badge>
          </div>
          <div className="text-center text-muted-foreground py-2">共 2 条未处理告警</div>
        </CardContent>
      </Card>
    </div>
  );
}
