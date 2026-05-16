import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import api from '@/lib/api';
import { formatQuota } from '@/lib/utils';
import { Activity, DollarSign, MessageSquare, Database } from 'lucide-react';

export default function Dashboard() {
  const { user, refreshUser } = useUser();
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    api.get('/user/dashboard').then((res) => {
      if (res.data.success) {
        setDashboardData(Array.isArray(res.data.data) ? res.data.data : []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalRequests = dashboardData.reduce((s, d) => s + (d.RequestCount || 0), 0);
  const totalQuota = dashboardData.reduce((s, d) => s + (d.Quota || 0), 0);
  const totalTokens = dashboardData.reduce((s, d) => s + (d.PromptTokens || 0) + (d.CompletionTokens || 0), 0);

  const chartData = dashboardData.map((d) => ({
    date: (d.Day || '').slice(5),
    requests: d.RequestCount || 0,
    tokens: (d.PromptTokens || 0) + (d.CompletionTokens || 0),
  })).slice(-30);

  const summaryCards = [
    {
      title: '请求总数', value: totalRequests.toLocaleString(),
      icon: Activity, color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: '消费额度', value: `¥${formatQuota(totalQuota)}`,
      icon: DollarSign, color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'Token 总量', value: totalTokens.toLocaleString(),
      icon: MessageSquare, color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-950',
    },
    {
      title: '账户余额', value: user ? `¥${formatQuota(user.quota || 0)}` : '-',
      icon: Database, color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map((i) => (
            <Card key={i}><CardContent className="p-4 sm:p-6"><Skeleton className="h-16 sm:h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-64 sm:h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">概览</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">系统使用情况统计</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`rounded-lg p-2 sm:p-3 ${card.bg} shrink-0`}>
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{card.title}</p>
                  <p className="text-lg sm:text-2xl font-bold truncate">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm sm:text-base">请求量趋势</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-60 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm sm:text-base">Token 消耗趋势</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-60 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
