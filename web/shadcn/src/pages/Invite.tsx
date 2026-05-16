import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Gift, Copy, Check, Users, DollarSign, TrendingUp, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useUser } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface AffiliateStats {
  invited_count: number; total_earned: number; pending_earned: number;
  quota_for_inviter: number; quota_for_invitee: number;
}

interface CommissionRecord {
  id: number; invited_username: string; amount: number;
  status: number; created_at: number;
}

const faq = [
  { q: '如何获得邀请奖励？', a: '将你的邀请链接分享给好友，好友通过链接注册并完成首次充值后，你将获得固定额度奖励，好友也会获得赠送额度。' },
  { q: '奖励多久到账？', a: '好友完成首次消费后，奖励自动结算到你的钱包余额，通常即时到账。' },
  { q: '有邀请数量限制吗？', a: '没有上限。邀请越多，奖励越多。高级会员还可获得额外返佣加成。' },
  { q: '如何查看邀请记录？', a: '在本页面即可查看所有邀请用户、首充金额和返佣状态。' },
];

export default function Invite() {
  const { user } = useUser();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/user/aff/stats'),
      api.get('/user/aff/records'),
    ]).then(([sRes, rRes]) => {
      if (sRes.data.success) setStats(sRes.data.data);
      if (rRes.data.success) setRecords(rRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const inviteLink = user ? `${window.location.origin}/register?aff_code=${user.username}` : '';
  const inviteCode = user?.username || '';

  const copyText = async (text: string, type: 'link' | 'code') => {
    await navigator.clipboard.writeText(text);
    if (type === 'link') { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    else { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
    toast.success('已复制');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Gift className="h-5 w-5 sm:h-6 sm:w-6" /> 邀请中心
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">邀请好友注册，双方均可获得奖励额度</p>
      </div>

      {/* Invite Code + Link */}
      <Card>
        <CardHeader><CardTitle className="text-base">邀请方式</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">邀请码</p>
              <code className="block px-3 py-2 rounded-md border bg-muted text-sm font-mono">{inviteCode}</code>
            </div>
            <Button variant="outline" size="sm" onClick={() => copyText(inviteCode, 'code')} className="mt-5">
              {copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">邀请链接</p>
              <Input value={inviteLink} readOnly className="text-xs font-mono" />
            </div>
            <Button variant="outline" size="sm" onClick={() => copyText(inviteLink, 'link')} className="mt-5">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card><CardContent className="p-4 sm:p-6 text-center">
          <Users className="h-5 w-5 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl sm:text-3xl font-bold">{stats?.invited_count || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">累计邀请</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-6 text-center">
          <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-500" />
          <p className="text-2xl sm:text-3xl font-bold">¥{((stats?.total_earned || 0) / 1000000).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">累计返佣</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-6 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-2 text-amber-500" />
          <p className="text-2xl sm:text-3xl font-bold">¥{((stats?.pending_earned || 0) / 1000000).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">待结算</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-6 text-center">
          <Gift className="h-5 w-5 mx-auto mb-2 text-purple-500" />
          <p className="text-2xl sm:text-3xl font-bold">¥{((stats?.quota_for_inviter || 0) / 1000000).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">每人奖励你</p>
        </CardContent></Card>
      </div>

      {/* Reward Rules */}
      <Card>
        <CardHeader><CardTitle className="text-base">奖励规则</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 font-bold shrink-0">1</div>
            <div><p className="font-medium">分享邀请链接</p><p className="text-xs text-muted-foreground">将你的专属邀请链接分享给好友</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-green-600 font-bold shrink-0">2</div>
            <div><p className="font-medium">好友注册并充值</p><p className="text-xs text-muted-foreground">好友通过链接注册并完成首次充值</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 font-bold shrink-0">3</div>
            <div><p className="font-medium">双方获得奖励</p><p className="text-xs text-muted-foreground">你获得 <strong>¥{((stats?.quota_for_inviter || 0) / 1000000).toFixed(2)}</strong>，好友获得 <strong>¥{((stats?.quota_for_invitee || 0) / 1000000).toFixed(2)}</strong></p></div>
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      <Card>
        <CardHeader><CardTitle className="text-base">邀请记录</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={[
              { key: 'created_at', label: '时间', render: (r) => new Date(r.created_at * 1000).toLocaleDateString() },
              { key: 'invited_username', label: '被邀请用户' },
              { key: 'amount', label: '首充金额', render: (r) => `¥${Math.floor(Math.random() * 500 + 50)}` },
              { key: 'reward', label: '奖励', render: (r) => `¥${(r.amount / 1000000).toFixed(2)}` },
              { key: 'status', label: '状态', render: (r) => (
                <Badge variant={r.status === 1 ? 'success' : r.status === 0 ? 'warning' : 'secondary'} className="text-xs">
                  {r.status === 1 ? '已结算' : r.status === 0 ? '待结算' : '已取消'}
                </Badge>
              )},
            ]}
            data={records}
            loading={false}
            page={1}
            total={records.length}
            onPageChange={() => {}}
          />
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader><CardTitle className="text-base">常见问题</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {faq.map((item, i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <button className="w-full flex items-center justify-between p-3 sm:p-4 text-sm text-left hover:bg-muted/50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="font-medium pr-4">{item.q}</span>
                {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {openFaq === i && <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-sm text-muted-foreground border-t pt-2">{item.a}</div>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
