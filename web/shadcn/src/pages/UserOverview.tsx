import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-auth';
import { useStatus } from '@/hooks/use-status';
import api from '@/lib/api';
import { formatQuota, renderQuota } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Package, Database, Activity, Crown, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Announcement {
  id: number; title: string; content: string; priority: number; created_at: number;
}

interface UsageStats {
  total_requests: number; total_tokens: number; total_quota: number;
  today_requests: number; today_tokens: number; today_quota: number;
  plan_quota_remaining: number; plan_quota_total: number; balance: number;
}

const faq = [
  { q: 'TokenPlan 和加量包的区别？', a: 'TokenPlan 是周期订阅配额，按月/季/年刷新。加量包是独立购买的额外额度，先消耗 TokenPlan，用完后再消耗加量包，最后扣余额。' },
  { q: '邀请奖励怎么计算？', a: '每邀请一位好友注册并完成首次消费，你将获得固定额度奖励，好友也获得赠送额度。' },
  { q: 'API Key 怎么用？', a: '在 API 密钥页面创建令牌，客户端设置 API Base 为部署地址 + /v1，API Key 使用生成的令牌。' },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4'];

export default function UserOverview() {
  const { user } = useUser();
  const { status } = useStatus();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/user/usage-stats'),
      api.get('/announcement/'),
    ]).then(([sRes, aRes]) => {
      if (sRes.data.success) setStats(sRes.data.data);
      if (aRes.data.success) setAnnouncements(aRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const topCards = [
    {
      title: 'TokenPlan 配额',
      value: stats ? renderQuota(stats.plan_quota_remaining || 0, status?.display_in_currency) : '-',
      sub: stats?.plan_quota_total ? `总额 ${renderQuota(stats.plan_quota_total, status?.display_in_currency)}` : '无活跃套餐',
      icon: Package, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950',
      action: () => navigate('/plans'),
    },
    {
      title: 'BoostPack 剩余',
      value: '¥0.00',
      sub: '暂无加量包',
      icon: Database, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950',
      action: () => navigate('/addon'),
    },
    {
      title: '钱包余额',
      value: stats ? renderQuota(stats.balance || 0, status?.display_in_currency) : '-',
      sub: '可用于 API 调用',
      icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950',
      action: () => navigate('/topup'),
    },
    {
      title: '请求数',
      value: stats?.total_requests?.toLocaleString() || '0',
      sub: `今日 ${stats?.today_requests || 0}`,
      icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950',
      action: () => navigate('/usage'),
    },
  ];

  // Generate mock trend data from today's stats
  const trendData = Array.from({ length: trendDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (trendDays - 1 - i));
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      tokens: Math.floor(Math.random() * (stats?.today_tokens || 10000) / 5),
      prompt: Math.floor(Math.random() * (stats?.today_tokens || 5000) / 5),
      completion: Math.floor(Math.random() * (stats?.today_tokens || 5000) / 5),
    };
  });

  const promptCompletion = [
    { name: 'Prompt', value: stats?.today_tokens ? Math.floor((stats?.today_tokens || 0) * 0.6) : 0 },
    { name: 'Completion', value: stats?.today_tokens ? Math.floor((stats?.today_tokens || 0) * 0.4) : 0 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">概览 Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">欢迎回来，{user?.username}</p>
        </div>
      </div>

      {/* Top 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {topCards.map((card) => (
          <Card key={card.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={card.action}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
              <p className="text-xl sm:text-2xl font-bold truncate">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Token Consumption Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base">Token 消耗趋势</CardTitle>
              <div className="flex gap-1">
                <Button variant={trendDays === 7 ? 'default' : 'outline'} size="sm" className="h-7 text-xs px-2" onClick={() => setTrendDays(7)}>7日</Button>
                <Button variant={trendDays === 30 ? 'default' : 'outline'} size="sm" className="h-7 text-xs px-2" onClick={() => setTrendDays(30)}>30日</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="tokens" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prompt/Completion Ratio */}
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm sm:text-base">Prompt / Completion</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="h-64 sm:h-72 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={promptCompletion} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value">
                    {promptCompletion.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-6 text-sm mt-4">
                {promptCompletion.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2"><Bell className="h-4 w-4" /> 公告</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className={cn(
                'p-3 rounded-lg border text-sm',
                a.priority === 1 && 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {a.priority === 1 && <Badge variant="warning" className="text-xs">重要</Badge>}
                  <span className="font-medium">{a.title}</span>
                </div>
                <p className="text-muted-foreground text-xs">{a.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-sm sm:text-base">快速问答 FAQ</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2">
          {faq.map((item, i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 text-sm text-left hover:bg-muted/50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium">{item.q}</span>
                {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-3 pb-3 text-sm text-muted-foreground border-t pt-2">{item.a}</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
