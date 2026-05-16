import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { HelpCircle, Bell, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Announcement {
  id: number; title: string; content: string; priority: number; created_at: number;
}

const faq = [
  { q: '额度是怎么计算的？', a: '额度 = 分组倍率 × 模型倍率 × (提示 token 数 + 补全 token 数 × 补全倍率)，其中补全倍率对于 GPT3.5 固定为 1.33，GPT4 为 2。' },
  { q: '套餐和加量包有什么区别？', a: '套餐是按周期订阅的配额（月/季/年），先消耗套餐配额；用尽后自动消耗加量包；两者都用完后扣除账户余额。' },
  { q: '邀请好友有什么奖励？', a: '每邀请一位好友注册并充值，你将获得一定额度的奖励，好友也将获得赠送额度。' },
  { q: 'API Key 怎么使用？', a: '在 API 密钥页面创建令牌，在客户端设置 API Base 为你的部署地址，API Key 使用生成的令牌。' },
  { q: '充值后多久到账？', a: '兑换码充值即时到账。在线支付根据支付方式不同可能需要等待回调通知（通常 1-5 分钟）。' },
];

export default function Help() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    api.get('/announcement/').then((res) => {
      if (res.data.success) setAnnouncements(res.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6" /> 公告与问答 <span className="text-sm font-normal text-muted-foreground">Help Center</span>
        </h1>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> 系统公告</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">暂无公告</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className={cn(
                  'p-3 rounded-lg border',
                  a.priority === 1 && 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    {a.priority === 1 && <Badge variant="warning">重要</Badge>}
                    <p className="font-medium text-sm">{a.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4" /> 常见问题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
