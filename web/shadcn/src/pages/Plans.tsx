import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Check, X as XIcon, Zap, Cpu, Shield, Rocket, Clock,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';

interface Plan {
  id: number; name: string; description: string; quota: number;
  price: number; duration_days: number; status: number;
}

interface UserPlan {
  id: number; plan_name: string; quota: number; remaining_quota: number;
  used_quota?: number; price: number; status: number;
  expired_time: number; created_time: number;
}

type Duration = 'month' | 'quarter' | 'year';

const durationDef: Record<Duration, { label: string; days: number; discount: string }> = {
  month: { label: '月付', days: 30, discount: '' },
  quarter: { label: '季付', days: 90, discount: '95折' },
  year: { label: '年付', days: 365, discount: '85折' },
};

interface TierDef {
  name: string; tag: string; icon: typeof Zap; color: string; bg: string;
  rpm: number; tpm: string; models: string[]; overage: string;
  features: string[];
}

const tierDefs: TierDef[] = [
  { name: 'Starter', tag: '入门', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950',
    rpm: 60, tpm: '60K', models: ['GPT-4o-mini', 'Claude Haiku', 'Gemini Flash'],
    overage: '¥0.8/1M', features: ['API Key', '基础日志', '标准线路'] },
  { name: 'Builder', tag: '最受欢迎', icon: Rocket, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950',
    rpm: 300, tpm: '300K', models: ['GPT-4o', 'Claude Sonnet', 'Gemini Pro', 'DeepSeek-V3'],
    overage: '¥0.6/1M', features: ['API Key', '完整日志', '优先线路', 'Webhook'] },
  { name: 'Scale', tag: '推荐', icon: Cpu, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950',
    rpm: 1000, tpm: '1M', models: ['GPT-4o', 'Claude Opus', 'Gemini Ultra', 'CodePlan', 'DeepSeek-R1'],
    overage: '¥0.4/1M', features: ['API Key', '完整日志', 'SLA线路', 'Webhook', '历史分析'] },
  { name: 'Enterprise', tag: '企业专属', icon: Shield, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950',
    rpm: -1, tpm: '定制', models: ['全模型访问', '私有部署', '定制模型'],
    overage: '协商', features: ['全部权益', '专属支持', 'SLA保障', '私有部署', '团队管理', '定制模型'] },
];

const compareFeatures = [
  { key: 'quota', label: '月Token额度' },
  { key: 'rpm', label: 'RPM' },
  { key: 'tpm', label: 'TPM' },
  { key: 'gpt4o', label: 'GPT-4o' },
  { key: 'claude', label: 'Claude Sonnet' },
  { key: 'codeplan', label: 'CodePlan' },
  { key: 'team', label: '团队管理' },
  { key: 'webhook', label: 'Webhook' },
  { key: 'sla', label: 'SLA线路' },
  { key: 'support', label: '专属支持' },
];

const compareData: Record<string, Record<string, string | boolean>> = {
  Starter: { quota: '10M', rpm: 60, tpm: '60K', gpt4o: false, claude: false, codeplan: false, team: false, webhook: false, sla: false, support: false },
  Builder: { quota: '80M', rpm: 300, tpm: '300K', gpt4o: true, claude: true, codeplan: false, team: false, webhook: true, sla: false, support: false },
  Scale: { quota: '200M', rpm: 1000, tpm: '1M', gpt4o: true, claude: true, codeplan: true, team: false, webhook: true, sla: true, support: false },
  Enterprise: { quota: '定制', rpm: '定制', tpm: '定制', gpt4o: true, claude: true, codeplan: true, team: true, webhook: true, sla: true, support: true },
};

const faq = [
  { q: '周期配额用完后怎么办？', a: '套餐配额用完后，自动消耗 BoostPack（加量包），仍不足时从账户余额扣费。超额价格见套餐卡底部。' },
  { q: '未用完的配额会累积到下个月吗？', a: '套餐配额按月/季/年周期重置，到期未用完的配额自动清零。建议根据实际用量选择合适的档位。' },
  { q: '可以随时升级或降级套餐吗？', a: '可以。升级立即生效，差价按剩余天数折算。降级将在当前周期结束后生效。' },
  { q: '企业套餐如何购买？', a: '企业套餐支持定制额度、模型权限和 SLA，请联系销售或通过工单系统咨询。' },
];

export default function Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [myPlan, setMyPlan] = useState<UserPlan | null>(null);
  const [buying, setBuying] = useState<number | null>(null);
  const [duration, setDuration] = useState<Duration>('month');
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/plan/'),
      api.get('/plan/user'),
    ]).then(([pRes, mRes]) => {
      if (pRes.data.success) setPlans(pRes.data.data || []);
      if (mRes.data.success) {
        const list = mRes.data.data || [];
        const active = list.find((p: UserPlan) => p.status === 1);
        setMyPlan(active || null);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const def = durationDef[duration];
  const filtered = plans.filter(p => p.duration_days === def.days);

  // Match API plans to tier defs by name
  const priceMap: Record<string, number> = {};
  filtered.forEach(p => { priceMap[p.name] = p.price; });

  const buyPlan = async (planId: number) => {
    setBuying(planId);
    try {
      const res = await api.post('/plan/purchase', { plan_id: planId });
      if (res.data.success) { toast.success('购买成功！'); fetchData(); }
      else toast.error(res.data.message || '购买失败');
    } catch { toast.error('购买失败') }
    finally { setBuying(null) }
  };

  const usagePercent = myPlan && myPlan.quota > 0
    ? Math.round(((myPlan.used_quota || myPlan.quota - (myPlan.remaining_quota || 0)) / myPlan.quota) * 100)
    : 0;

  const durations: Duration[] = ['month', 'quarter', 'year'];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">资源商店</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          选择适合你的 TokenPlan，获得更高额度、更强模型权限与更快响应速度
        </p>
      </div>

      {/* Current Plan Banner */}
      {myPlan ? (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">当前套餐</Badge>
                  <span className="font-semibold text-base">{myPlan.plan_name}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">总额度</p>
                    <p className="font-medium">{((myPlan.quota || 0) / 1000000).toFixed(0)}M Tokens</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{myPlan.expired_time > 0 ? '到期时间' : '状态'}</p>
                    <p className="font-medium">{myPlan.expired_time > 0 ? new Date(myPlan.expired_time * 1000).toLocaleDateString() : '永久有效'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">已使用</p>
                    <p className="font-medium">{((myPlan.used_quota || myPlan.quota - (myPlan.remaining_quota || 0)) / 1000000).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">剩余</p>
                    <p className="font-bold text-primary">{((myPlan.remaining_quota || 0) / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
                <Progress value={usagePercent} className="h-2 max-w-md" />
                <p className="text-xs text-muted-foreground">使用率 {usagePercent}%</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => navigate('/addon')}>购买 BoostPack</Button>
                <Button size="sm">升级套餐</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : null}

      {/* Period Tabs */}
      <div className="flex gap-2 bg-muted p-1 rounded-lg w-fit">
        {durations.map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className={cn(
              'relative px-5 py-2 text-sm font-medium rounded-md transition-all',
              duration === d ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {durationDef[d].label}
            {durationDef[d].discount && (
              <span className="ml-1.5 text-[10px] text-green-600 dark:text-green-400 font-semibold">
                {durationDef[d].discount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pricing Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tierDefs.map((tier) => {
            const price = priceMap[tier.name];
            const isCurrent = myPlan?.plan_name === tier.name;

            return (
              <Card key={tier.name} className={cn(
                'flex flex-col relative',
                tier.tag === '最受欢迎' && 'border-primary ring-1 ring-primary',
                isCurrent && 'border-green-500 ring-1 ring-green-500'
              )}>
                {tier.tag && (
                  <div className="absolute top-3 right-3">
                    <Badge variant={tier.tag === '最受欢迎' ? 'default' : 'secondary'} className="text-xs">
                      {tier.tag}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-5 flex flex-col flex-1">
                  {/* Name + Icon */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${tier.bg}`}>
                      <tier.icon className={`h-4 w-4 ${tier.color}`} />
                    </div>
                    <h3 className="font-semibold text-base">{tier.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {price !== undefined ? (
                      <><span className="text-2xl font-bold">¥{price}</span><span className="text-sm text-muted-foreground ml-1">/{def.label.replace('付','')}</span></>
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">联系销售</span>
                    )}
                  </div>

                  {/* Core quota */}
                  <div className="mb-3">
                    <p className="text-lg font-bold">{compareData[tier.name].quota}</p>
                    <p className="text-xs text-muted-foreground">Tokens / {def.label.replace('付','')}</p>
                  </div>

                  {/* Limits */}
                  <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                    <span>{tier.rpm > 0 ? `${tier.rpm} RPM` : '定制'}</span>
                    <span>{tier.tpm} TPM</span>
                  </div>

                  {/* Models */}
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1.5">支持模型</p>
                    <div className="flex flex-wrap gap-1">
                      {tier.models.map(m => (
                        <Badge key={m} variant="outline" className="text-[10px] py-0">{m}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Overage */}
                  <p className="text-xs text-muted-foreground mb-4">超额 {tier.overage}</p>

                  {/* Features */}
                  <div className="space-y-2 flex-1 mb-4">
                    {tier.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">当前套餐</Button>
                  ) : price !== undefined ? (
                    <Button
                      className="w-full"
                      variant={tier.tag === '最受欢迎' ? 'default' : 'outline'}
                      onClick={() => {
                        const plan = filtered.find(p => p.name === tier.name);
                        if (plan) buyPlan(plan.id);
                      }}
                      disabled={buying !== null}
                    >
                      {buying === filtered.find(p => p.name === tier.name)?.id ? '购买中...' : '立即升级'}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full">联系销售</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Feature Comparison Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">套餐对比</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6 overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-medium text-muted-foreground">功能</th>
                {tierDefs.map(t => (
                  <th key={t.name} className="p-3 text-center font-semibold">{t.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFeatures.map((f) => (
                <tr key={f.key} className="border-b last:border-0">
                  <td className="p-3 text-muted-foreground">{f.label}</td>
                  {tierDefs.map(t => {
                    const val = compareData[t.name][f.key];
                    return (
                      <td key={t.name} className="p-3 text-center">
                        {typeof val === 'boolean' ? (
                          val ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <XIcon className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="font-medium">{String(val)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* BoostPack Entry */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-base">需要更多额度？</h3>
            <p className="text-sm text-muted-foreground">购买 BoostPack 加量包，灵活补充，先消耗套餐配额，用完后再自动消耗加量包</p>
          </div>
          <Button onClick={() => navigate('/addon')} className="shrink-0">
            购买 BoostPack <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader><CardTitle className="text-base">常见问题</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {faq.map((item, i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 sm:p-4 text-sm text-left hover:bg-muted/50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium pr-4">{item.q}</span>
                {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-sm text-muted-foreground border-t pt-2">{item.a}</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
