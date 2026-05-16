import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-auth';
import { useStatus } from '@/hooks/use-status';
import api from '@/lib/api';
import { formatQuota, renderQuota } from '@/lib/utils';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Wallet, TrendingUp, MessageSquare, Activity, PiggyBank,
  ChevronDown, ChevronUp, Copy, Check, ExternalLink, Gift, Zap,
  CreditCard, Ticket, Clock, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react';

// ---------- Types ----------
interface LedgerEntry {
  id: number; created_at: number; type: number; amount: number;
  description: string; status: number;
}

const presetAmounts = [
  { value: 10, bonus: 0 }, { value: 50, bonus: 0 }, { value: 100, bonus: 0 },
  { value: 300, bonus: 5, tag: '送5%' }, { value: 500, bonus: 10, tag: '送10%' },
  { value: 1000, bonus: 15, tag: '送15%' },
];

const paymentMethods = [
  { id: 'alipay', label: '支付宝', icon: '💳' },
  { id: 'wechat', label: '微信支付', icon: '💚' },
  { id: 'stripe', label: 'Stripe', icon: '⚡' },
  { id: 'usdt', label: 'USDT', icon: '₿' },
];

const faq = [
  { q: '钱包和 TokenPlan 有什么区别？', a: '钱包余额是通用资金，可用于超额扣费和购买套餐。TokenPlan 是订阅制配额，按月/季/年周期刷新，先消耗套餐配额。' },
  { q: '钱包余额可以提现吗？', a: '钱包余额为充值所得，用于 API 消费，暂不支持提现。如有特殊情况请联系客服。' },
  { q: 'BoostPack 什么时候扣？', a: '扣费顺序：TokenPlan → BoostPack → 钱包余额。套餐配额用完后自动消耗 BoostPack，二者都用完才扣钱包。' },
  { q: '超额怎么计费？', a: '套餐配额用完后，超出部分按套餐卡标注的超额价格从钱包余额扣费。例如 Starter 超额 ¥0.8/1M Tokens。' },
  { q: '自动续费怎么关闭？', a: '在 账号与套餐 页面找到当前订阅，点击「取消自动续费」即可。当前周期不受影响。' },
];

export default function WalletPage() {
  const { user, refreshUser } = useUser();
  const { status } = useStatus();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Ledger
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerTab, setLedgerTab] = useState('all');

  // Redeem
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  // Payment
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('alipay');

  // Invite
  const [inviteStats, setInviteStats] = useState({ invited_count: 0, total_earned: 0, pending_earned: 0 });
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Plan
  const [activePlan, setActivePlan] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/user/usage-stats'),
      api.get('/user/aff/stats'),
      api.get('/user/aff/records'),
      api.get('/log/self/', { params: { p: 1, type: '1,2,3,4,5' } }),
      api.get('/user/plan'),
    ]).then(([statsRes, affRes, recRes, logRes, planRes]) => {
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (affRes.data.success) setInviteStats(affRes.data.data);
      if (recRes.data.success) setInvitedUsers(recRes.data.data || []);
      if (logRes.data.success) setLedger(logRes.data.data || []);
      if (planRes.data.success) setActivePlan(planRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const [stats, setStats] = useState<any>(null);

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await api.post('/user/topup', { key: redeemCode.trim() });
      if (res.data.success) {
        toast.success(`充值成功！+${(res.data.data / 1000000).toFixed(2)}`);
        setRedeemCode('');
        refreshUser();
      } else toast.error(res.data.message || '充值失败');
    } catch { toast.error('充值失败') }
    finally { setRedeeming(false) }
  };

  const handlePayment = async () => {
    const amount = selectedAmount || parseInt(customAmount) || 0;
    if (amount <= 0) { toast.error('请选择或输入金额'); return; }
    try {
      const res = await api.post('/payment/create', { amount });
      if (res.data.success) {
        window.open(res.data.data.url, '_blank');
      } else toast.error(res.data.message || '创建支付失败');
    } catch { toast.error('支付服务不可用') }
  };

  const inviteLink = user ? `${window.location.origin}/register?aff_code=${user.username}` : '';
  const copyInvite = () => { navigator.clipboard.writeText(inviteLink); setCopied(true); toast.success('已复制'); setTimeout(() => setCopied(false), 2000); };

  const planUsage = activePlan && activePlan.quota > 0
    ? Math.round(((activePlan.used_quota || activePlan.quota - (activePlan.remaining_quota || 0)) / activePlan.quota) * 100)
    : 0;

  const filteredLedger = ledger.filter(l => {
    if (ledgerTab === 'all') return true;
    if (ledgerTab === 'consume') return l.type === 2;
    if (ledgerTab === 'topup') return l.type === 1;
    if (ledgerTab === 'reward') return l.type === 3;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  const displayCurrency = status?.display_in_currency ?? true;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" /> 钱包
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">管理余额、Token 资产、订阅与账单</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/topup')}><CreditCard className="h-4 w-4 mr-1" /> 立即充值</Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/addon')}><Zap className="h-4 w-4 mr-1" /> 购买 BoostPack</Button>
        </div>
      </div>

      {/* Billing Rule Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="p-3 sm:p-4 flex items-center gap-3 text-sm">
          <Info className="h-4 w-4 text-blue-500 shrink-0" />
          <span>扣费顺序：<strong>TokenPlan</strong> → <strong>BoostPack</strong> → <strong>钱包余额</strong></span>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">钱包余额</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{renderQuota(user?.quota || 0, displayCurrency)}</p>
          <p className="text-xs text-muted-foreground mt-1">可用余额</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">Token 资产</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {((stats?.plan_quota_remaining || 0) / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-muted-foreground mt-1">Plan + BoostPack</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">本月支出</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">¥{formatQuota(stats?.total_quota || 0)}</p>
          <p className="text-xs text-green-600 mt-1">节省 ¥{(stats?.total_quota || 0) > 1000 ? ((stats?.total_quota || 0) * 0.15 / 1000000).toFixed(2) : '0.00'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">API 请求</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{(stats?.total_requests || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">错误率 0.2%</p>
        </CardContent></Card>
      </div>

      {/* Two Column: Add Funds + Subscription */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Left: Add Funds */}
        <Card>
          <CardHeader><CardTitle className="text-base"><CreditCard className="h-4 w-4 inline mr-2" />添加资金</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Preset amounts */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">选择金额</p>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map(a => (
                  <button key={a.value} onClick={() => { setSelectedAmount(a.value); setCustomAmount(''); }}
                    className={cn(
                      'p-2.5 rounded-lg border text-sm font-medium transition-all text-center',
                      selectedAmount === a.value ? 'border-primary bg-primary/5 text-primary' : 'hover:border-muted-foreground/30'
                    )}>
                    ¥{a.value}
                    {a.tag && <div className="text-[10px] text-green-600 font-semibold">{a.tag}</div>}
                  </button>
                ))}
              </div>
            </div>
            {/* Custom amount */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">自定义</span>
              <Input value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                placeholder="输入金额" type="number" className="w-32" />
              <span className="text-xs text-muted-foreground">最低 ¥10</span>
            </div>
            {/* Payment method */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">支付方式</p>
              <div className="flex gap-2">
                {paymentMethods.map(pm => (
                  <button key={pm.id} onClick={() => setSelectedPayment(pm.id)}
                    className={cn(
                      'p-2.5 rounded-lg border text-sm transition-all flex-1 text-center',
                      selectedPayment === pm.id ? 'border-primary bg-primary/5 text-primary' : 'hover:border-muted-foreground/30'
                    )}>
                    <span className="text-lg">{pm.icon}</span>
                    <div className="text-xs mt-0.5">{pm.label}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Redeem code */}
            <div className="flex gap-2">
              <Input value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder="兑换码" onKeyDown={(e) => e.key === 'Enter' && handleRedeem()} />
              <Button variant="outline" onClick={handleRedeem} disabled={redeeming}>{redeeming ? '...' : '兑换'}</Button>
            </div>
            {/* CTA */}
            <Button className="w-full h-10" onClick={handlePayment}>
              {selectedAmount || customAmount ? `支付 ¥${selectedAmount || parseInt(customAmount) || 0}` : '立即充值'}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Subscription */}
        <Card>
          <CardHeader><CardTitle className="text-base"><Activity className="h-4 w-4 inline mr-2" />订阅状态</CardTitle></CardHeader>
          <CardContent>
            {activePlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="default" className="text-xs mb-1">当前套餐</Badge>
                    <p className="font-semibold text-lg">{activePlan.plan_name}</p>
                  </div>
                  <Badge variant="success">生效中</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Token 剩余</span><span className="font-medium">{((activePlan.remaining_quota || 0) / 1000000).toFixed(1)}M</span></div>
                  <Progress value={planUsage} className="h-1.5" />
                  <div className="flex justify-between"><span className="text-muted-foreground">使用率</span><span>{planUsage}%</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">剩余时间</span>
                    <span className="font-medium">{activePlan.expired_time > 0 ? `${Math.max(0, Math.ceil((activePlan.expired_time - Date.now() / 1000) / 86400))}天` : '永久'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">自动续费</span>
                    <Badge variant="secondary" className="text-xs">已开启</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => navigate('/plans')}>升级套餐</Button>
                  <Button size="sm" variant="outline" className="flex-1">管理订阅</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-3">暂无活跃套餐</p>
                <Button size="sm" onClick={() => navigate('/plans')}>订阅套餐</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BoostPack Entry */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-medium">BoostPack 加量包</p>
              <p className="text-sm text-muted-foreground">剩余 12M Tokens · 7天内即将过期 2M</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => navigate('/addon')}>查看资源包</Button>
            <Button size="sm" onClick={() => navigate('/addon')}>立即增购</Button>
          </div>
        </CardContent>
      </Card>

      {/* Ledger */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">账单流水</CardTitle>
            <div className="flex gap-1">
              {['all','consume','topup','reward'].map(t => (
                <button key={t} onClick={() => setLedgerTab(t)}
                  className={cn('px-2.5 py-1 text-xs rounded-md transition-all',
                    ledgerTab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}>{t === 'all' ? '全部' : t === 'consume' ? '消耗' : t === 'topup' ? '充值' : '奖励'}</button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={[
              { key: 'created_at', label: '时间', render: (l) => new Date(l.created_at * 1000).toLocaleString(), hideOnMobile: true },
              { key: 'type', label: '类型', render: (l) => {
                const labels: Record<number, { label: string; variant: 'success' | 'destructive' | 'warning' | 'secondary' }> = {
                  1: { label: '充值', variant: 'success' }, 2: { label: '消耗', variant: 'destructive' },
                  3: { label: '返佣', variant: 'warning' }, 4: { label: '奖励', variant: 'secondary' },
                };
                const info = labels[l.type] || { label: '其他', variant: 'secondary' };
                return <Badge variant={info.variant} className="text-xs">{info.label}</Badge>;
              }},
              { key: 'amount', label: '金额变化', render: (l) => {
                const isPositive = [1,3,4].includes(l.type);
                return <span className={cn('font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
                  {isPositive ? '+' : '-'}¥{Math.abs(l.amount / 1000000).toFixed(2)}</span>;
              }},
              { key: 'description', label: '来源', render: (l) => <span className="text-xs">{l.description || '-'}</span> },
              { key: 'status', label: '状态', render: (l) => <Badge variant="success" className="text-xs">成功</Badge> },
            ]}
            data={filteredLedger.slice(0, 10)}
            loading={false}
            page={1}
            total={Math.min(filteredLedger.length, 10)}
            onPageChange={() => {}}
          />
        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Gift className="h-4 w-4" /> 邀请返佣</CardTitle>
          <CardDescription>邀请好友注册，获得返佣奖励</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={inviteLink} readOnly className="text-xs font-mono" />
            <Button variant="outline" size="sm" onClick={copyInvite}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{inviteStats.invited_count}</p>
              <p className="text-xs text-muted-foreground">累计邀请</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold">¥{((inviteStats.total_earned || 0) / 1000000).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">累计返佣</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold">¥{((inviteStats.pending_earned || 0) / 1000000).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">待结算</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold">¥8,320</p>
              <p className="text-xs text-muted-foreground">累计充值</p>
            </CardContent></Card>
          </div>
          {invitedUsers.length > 0 && (
            <DataTable
              columns={[
                { key: 'invited_username', label: '用户' },
                { key: 'created_at', label: '注册时间', render: (r) => new Date(r.created_at * 1000).toLocaleDateString() },
                { key: 'amount', label: '奖励', render: (r) => `¥${(r.amount / 1000000).toFixed(2)}` },
                { key: 'status', label: '状态', render: (r) => <Badge variant={r.status === 1 ? 'success' : 'warning'} className="text-xs">{r.status === 1 ? '已结算' : '待结算'}</Badge> },
              ]}
              data={invitedUsers}
              loading={false}
              page={1}
              total={invitedUsers.length}
              onPageChange={() => {}}
            />
          )}
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

function Info(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>; }
