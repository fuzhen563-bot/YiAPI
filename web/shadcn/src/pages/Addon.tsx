import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Package, Zap, TrendingUp, Clock, Check, X as XIcon,
  ChevronDown, ChevronUp, ShoppingCart, CreditCard, Layers,
  ArrowRight, Info,
} from 'lucide-react';

// ---------- Types ----------
type PackCategory = 'all' | 'general' | 'gpt' | 'claude' | 'code' | 'enterprise';

const categories: { key: PackCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'general', label: '通用资源包' },
  { key: 'gpt', label: 'GPT专项包' },
  { key: 'claude', label: 'Claude专项包' },
  { key: 'code', label: 'Code专项包' },
  { key: 'enterprise', label: '企业包' },
];

interface SkuPack {
  id: number; name: string; category: PackCategory; tokens: number;
  price: number; days: number; tag?: string; tagColor?: string;
  models?: string[]; unitPrice: number; saving: string;
}

const skuPacks: SkuPack[] = [
  { id: 1, name: 'Lite Pack', category: 'general', tokens: 5000000, price: 49, days: 30, unitPrice: 9.80, saving: '省18%', models: ['GPT-4o-mini', 'Claude Haiku', 'Gemini Flash'] },
  { id: 2, name: 'Standard Pack', category: 'general', tokens: 20000000, price: 169, days: 60, tag: '推荐', tagColor: 'bg-amber-500', unitPrice: 8.45, saving: '省30%', models: ['GPT-4o', 'Claude Sonnet', 'Gemini Pro', 'DeepSeek'] },
  { id: 3, name: 'Pro Pack', category: 'general', tokens: 100000000, price: 699, days: 90, tag: '最划算', tagColor: 'bg-purple-500', unitPrice: 6.99, saving: '省42%', models: ['GPT-4o', 'Claude Opus', 'Gemini Ultra', 'DeepSeek-R1', 'CodePlan'] },
  { id: 4, name: 'GPT Turbo', category: 'gpt', tokens: 10000000, price: 99, days: 30, tag: '热门', tagColor: 'bg-blue-500', unitPrice: 9.90, saving: '省17%', models: ['GPT-4o', 'GPT-4o-mini', 'o1', 'o3'] },
  { id: 5, name: 'GPT Max', category: 'gpt', tokens: 50000000, price: 399, days: 60, unitPrice: 7.98, saving: '省33%', models: ['GPT-4o', 'GPT-4o-mini', 'o1', 'o3', 'GPT-4.1'] },
  { id: 6, name: 'Claude Booster', category: 'claude', tokens: 10000000, price: 109, days: 30, unitPrice: 10.90, saving: '省9%', models: ['Claude Opus', 'Claude Sonnet', 'Claude Haiku'] },
  { id: 7, name: 'Claude Max', category: 'claude', tokens: 40000000, price: 359, days: 60, tag: '推荐', tagColor: 'bg-amber-500', unitPrice: 8.98, saving: '省25%', models: ['Claude Opus', 'Claude Sonnet', 'Claude Haiku'] },
  { id: 8, name: 'Code Pack', category: 'code', tokens: 5000000, price: 59, days: 30, unitPrice: 11.80, saving: '省2%', models: ['DeepSeek-R1', 'CodePlan', 'GPT-4o'] },
  { id: 9, name: 'Code Pro', category: 'code', tokens: 20000000, price: 199, days: 60, tag: '推荐', tagColor: 'bg-amber-500', unitPrice: 9.95, saving: '省17%', models: ['DeepSeek-R1', 'CodePlan', 'o3', 'Sonnet'] },
  { id: 10, name: 'Enterprise', category: 'enterprise', tokens: 500000000, price: 2999, days: 180, tag: '限时', tagColor: 'bg-red-500', unitPrice: 6.00, saving: '省50%', models: ['全模型', '私有部署', '定制'], modelsShort: '全模型+私有' },
];

const faq = [
  { q: '资源包和套餐有什么区别？', a: 'TokenPlan 是周期性订阅（月/季/年），到期重置。资源包是一次性购买的额外额度，用完即止，不会周期重置。扣费时先消耗 TokenPlan，再用资源包。' },
  { q: '资源包会自动使用吗？', a: '是的。系统自动按照「最早过期优先」的顺序自动消耗资源包，无需手动操作。' },
  { q: '资源包过期怎么办？', a: '资源包超过有效期后未用完的额度自动失效。建议根据实际用量选择有效期合适的资源包。' },
  { q: '资源包可以退款吗？', a: '未使用的资源包在购买后7天内可申请退款。已部分消耗的资源包不支持退款。' },
  { q: '哪种资源包最划算？', a: 'Pro Pack（通用）单价最低，仅 ¥6.99/1M，适合用量大的用户。如果主要使用特定模型，专项包针对性更强。' },
];

const compareData = [
  { name: '钱包按量', price: 12, unit: '¥12', highlight: false },
  { name: 'Lite Pack', price: 9.8, unit: '¥9.8', highlight: false },
  { name: 'Standard Pack', price: 8.45, unit: '¥8.45', highlight: true },
  { name: 'Pro Pack', price: 6.99, unit: '¥6.99', highlight: false },
];

interface UserPack {
  id: number; name: string; total_quota: number; remaining_quota: number;
  expired_at: number; status: number; created_at: number;
}

export default function Addon() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<PackCategory>('all');
  const [userPacks, setUserPacks] = useState<UserPack[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [buyModal, setBuyModal] = useState<SkuPack | null>(null);
  const [buyPayment, setBuyPayment] = useState('alipay');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/user/resource-packs'),
    ]).then(([pRes]) => {
      if (pRes.data.success) setUserPacks(pRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = category === 'all' ? skuPacks : skuPacks.filter(p => p.category === category);

  const totalRemaining = userPacks.filter(p => p.status === 1).reduce((s, p) => s + (p.remaining_quota || 0), 0);
  const expiringSoon = userPacks.filter(p => p.status === 1 && p.expired_at > 0 && p.expired_at < Date.now() / 1000 + 7 * 86400);
  const expiringTokens = expiringSoon.reduce((s, p) => s + (p.remaining_quota || 0), 0);

  const statusLabel = (s: number) => {
    switch (s) {
      case 1: return <Badge variant="success" className="text-xs">生效中</Badge>;
      case 2: return <Badge variant="destructive" className="text-xs">已过期</Badge>;
      case 3: return <Badge variant="secondary" className="text-xs">已耗尽</Badge>;
      default: return <Badge variant="outline" className="text-xs">未知</Badge>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6" /> 资源商店
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">购买额外 Token 资源包，在套餐额度耗尽后自动续航，并降低超额成本</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/topup')}><CreditCard className="h-4 w-4 mr-1" /> 充值</Button>
          <Button size="sm" variant="outline"><Layers className="h-4 w-4 mr-1" /> 我的资源包</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">总剩余 Token</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{(totalRemaining / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-muted-foreground mt-1">{userPacks.filter(p => p.status === 1).length} 个资源包</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">即将过期</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{(expiringTokens / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-amber-600 mt-1">{expiringSoon.length > 0 ? `${expiringSoon.length} 个资源包即将过期` : '无'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">当前节省</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">¥218</p>
          <p className="text-xs text-green-600 mt-1">相比按量节省 30%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">启用状态</p>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">自动启用</p>
          <p className="text-xs text-muted-foreground mt-1">最早过期优先消耗</p>
        </CardContent></Card>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all shrink-0',
              category === c.key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >{c.label}</button>
        ))}
      </div>

      {/* SKU Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(pack => (
          <Card key={pack.id} className="flex flex-col relative overflow-hidden">
            {pack.tag && (
              <div className={cn('absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white', pack.tagColor)}>
                {pack.tag}
              </div>
            )}
            <CardContent className="p-5 flex flex-col flex-1">
              <h3 className="font-semibold text-base mb-1">{pack.name}</h3>
              <p className="text-2xl font-bold mb-1">¥{pack.price}</p>
              <p className="text-xs text-muted-foreground mb-4">{(pack.tokens / 10000).toFixed(0)} 万 Tokens · {pack.days}天有效</p>

              <div className="space-y-1.5 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">单价</span>
                  <span>¥{pack.unitPrice} / 1M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">节省</span>
                  <span className="text-green-600 font-medium">{pack.saving}</span>
                </div>
              </div>

              {pack.models && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1">支持模型</p>
                  <div className="flex flex-wrap gap-1">
                    {(pack.modelsShort ? [pack.modelsShort] : pack.models.slice(0, 3)).map(m => (
                      <Badge key={m} variant="outline" className="text-[10px] py-0">{m}</Badge>
                    ))}
                    {!pack.modelsShort && pack.models.length > 3 && <Badge variant="outline" className="text-[10px]">+{pack.models.length - 3}</Badge>}
                  </div>
                </div>
              )}

              <div className="flex-1" />
              <Button className="w-full" variant={pack.tag === '推荐' || pack.tag === '最划算' ? 'default' : 'outline'}
                onClick={() => setBuyModal(pack)}>
                <ShoppingCart className="h-4 w-4 mr-1" /> 立即购买
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compare Section */}
      <Card>
        <CardHeader><CardTitle className="text-base">性价比对比</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead><tr className="border-b">
                <th className="p-3 text-left font-medium text-muted-foreground">方式</th>
                <th className="p-3 text-right font-medium text-muted-foreground">单价 / 1M</th>
                <th className="p-3 text-right font-medium text-muted-foreground">节省</th>
              </tr></thead>
              <tbody>
                {compareData.map((d, i) => (
                  <tr key={i} className={cn('border-b last:border-0', d.highlight && 'bg-primary/5')}>
                    <td className="p-3 font-medium">{d.name}{d.highlight && <Badge variant="default" className="ml-2 text-[10px]">最优解</Badge>}</td>
                    <td className="p-3 text-right">¥{d.unit}</td>
                    <td className="p-3 text-right">{i === 0 ? '-' : `${Math.round((1 - d.price / 12) * 100)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Billing Flow */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4 text-blue-500" /> 消耗规则</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="font-medium">TokenPlan</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="font-medium">资源包<span className="text-xs text-muted-foreground ml-1">(最早过期优先)</span></span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 dark:bg-green-900/40">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="font-medium">钱包余额</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>• 资源包自动启用，无需手动操作</p>
            <p>• 按「最早过期优先」顺序消耗（FIFO）</p>
            <p>• 专项资源包仅限指定模型消耗</p>
            <p>• 到期未用完的额度自动失效</p>
          </div>
        </CardContent>
      </Card>

      {/* My Inventory */}
      {userPacks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base"><Layers className="h-4 w-4 inline mr-2" /> 我的资源包</CardTitle></CardHeader>
          <CardContent className="p-0 sm:p-6">
            <DataTable
              columns={[
                { key: 'name', label: '名称' },
                { key: 'total_quota', label: '总量', render: (p) => `${(p.total_quota / 1000000).toFixed(1)}M` },
                { key: 'remaining_quota', label: '剩余', render: (p) => {
                  const pct = p.total_quota > 0 ? (p.remaining_quota / p.total_quota) * 100 : 0;
                  return <div className="flex items-center gap-2"><Progress value={pct} className="h-1.5 w-16" /><span className="text-xs">{(p.remaining_quota / 1000000).toFixed(1)}M</span></div>;
                }},
                { key: 'expired_at', label: '到期时间', render: (p) => p.expired_at > 0 ? new Date(p.expired_at * 1000).toLocaleDateString() : '永久' },
                { key: 'status', label: '状态', render: (p) => statusLabel(p.status) },
              ]}
              data={userPacks}
              loading={loading}
              page={1}
              total={userPacks.length}
              onPageChange={() => {}}
            />
          </CardContent>
        </Card>
      )}

      {/* Orders - placeholder for now */}
      <Card>
        <CardHeader><CardTitle className="text-base">订单记录</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground text-center py-6">暂无订单记录</CardContent>
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

      {/* Purchase Modal */}
      {buyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setBuyModal(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>购买 {buyModal.name}</span>
                <button onClick={() => setBuyModal(null)} className="text-muted-foreground hover:text-foreground"><XIcon className="h-4 w-4" /></button>
              </CardTitle>
              <CardDescription>确认购买信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Token 数量</span><span className="font-medium">{(buyModal.tokens / 10000).toFixed(0)} 万</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">有效期</span><span className="font-medium">{buyModal.days} 天</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">价格</span><span className="font-bold text-lg">¥{buyModal.price}</span></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">支付方式</p>
                <div className="flex gap-2">
                  {['alipay','wechat','stripe'].map(pm => (
                    <button key={pm} onClick={() => setBuyPayment(pm)}
                      className={cn('flex-1 p-2.5 rounded-lg border text-sm transition-all text-center',
                        buyPayment === pm ? 'border-primary bg-primary/5 text-primary' : 'hover:border-muted-foreground/30'
                      )}>{pm === 'alipay' ? '💳 支付宝' : pm === 'wechat' ? '💚 微信' : '⚡ Stripe'}</button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={() => {
                toast.success(`购买 ${buyModal.name} 成功！`);
                setBuyModal(null);
              }}>确认支付 ¥{buyModal.price}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Info(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
}
