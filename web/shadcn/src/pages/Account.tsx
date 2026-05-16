import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { useUser } from '@/hooks/use-auth';
import { useStatus } from '@/hooks/use-status';
import api from '@/lib/api';
import { renderQuota } from '@/lib/utils';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  User, Shield, Key, Bell, Globe, Clock, CreditCard, Gift,
  ChevronDown, ChevronUp, Check, X as XIcon, Smartphone, Mail,
  Github, Twitter, Lock, Fingerprint, LogOut, Star, Zap,
  RefreshCw, Copy, ExternalLink, Award, Target,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ---------- Data ----------
const languages = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

const timezones = [
  { value: 'UTC+8', label: 'Asia/Shanghai (UTC+8)' },
  { value: 'auto', label: '跟随系统' },
];

const currencies = [
  { value: 'CNY', label: 'CNY ¥' },
  { value: 'USD', label: 'USD $' },
];

const loginRecords = [
  { time: '2026/05/13 09:32', ip: '192.168.1.100', device: 'Chrome 125 / Windows', location: '上海市', status: 'success' },
  { time: '2026/05/12 18:15', ip: '192.168.1.100', device: 'Safari / macOS', location: '上海市', status: 'success' },
  { time: '2026/05/11 07:42', ip: '10.0.0.1', device: 'Mobile App / iOS', location: '北京市', status: 'success' },
];

const integrations = [
  { name: 'OpenAI', icon: '🤖', status: '已连接', scope: 'API Key 同步' },
  { name: 'Claude', icon: '🟣', status: '未连接', scope: '' },
  { name: 'GitHub', icon: '🐙', status: '已连接', scope: 'OAuth 登录' },
  { name: 'Slack', icon: '💬', status: '未连接', scope: '' },
  { name: 'Discord', icon: '🎮', status: '未连接', scope: '' },
  { name: 'Webhook', icon: '🔄', status: '未连接', scope: '' },
];

export default function Account() {
  const { user, logout } = useUser();
  const { status } = useStatus();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'binding' | 'preferences'>('binding');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkDays, setCheckDays] = useState(3);

  // Language/preferences
  const [lang, setLang] = useState('zh-CN');
  const [tz, setTz] = useState('UTC+8');
  const [currency, setCurrency] = useState('CNY');

  useEffect(() => {
    api.get('/user/usage-stats').then(() => {}).finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const userLevel = 'SVIP';
  const levelNames = ['Starter', 'Builder', 'Scale', 'Enterprise'];
  const currentLevelIdx = 2;
  const growthValue = 8920;
  const growthNext = 10000;
  const growthPct = (growthValue / growthNext) * 100;

  const summaryCards = [
    { title: '钱包余额', value: renderQuota(user.quota || 0, status?.display_in_currency), sub: '可用余额', icon: CreditCard },
    { title: 'Token 资产', value: '59.2M', sub: 'Plan + Pack', icon: Zap },
    { title: 'API 请求', value: '13,892', sub: '错误率 0.2%', icon: Target },
    { title: '当前等级', value: userLevel, sub: 'Scale 套餐', icon: Award, valueClass: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ===== Profile Header ===== */}
      <Card className="relative overflow-hidden">
        <div className="h-20 sm:h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="relative -mt-10 sm:-mt-14 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-background">
                <AvatarFallback className="text-xl sm:text-2xl bg-primary text-primary-foreground">{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold">{user.display_name || user.username}</h1>
                  <Badge variant="default" className="text-xs bg-purple-600">SVIP</Badge>
                  <Badge variant="secondary" className="text-xs">Scale 套餐</Badge>
                  {user.role === 1 && <Badge variant="outline" className="text-xs">管理员</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">编辑资料</Button>
              <Button size="sm" onClick={() => navigate('/plans')}>升级套餐</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Summary Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map(card => (
          <Card key={card.title}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2">
                <card.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
              <p className={cn('text-xl sm:text-2xl font-bold', card.valueClass)}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== Two Column Layout ===== */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Account Binding */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3">
              <div className="flex gap-4 border-b pb-3">
                {(['binding', 'preferences'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn('text-sm font-medium pb-3 -mb-3 border-b-2 transition-colors',
                      activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                    )}>
                    {tab === 'binding' ? '账户绑定' : tab === 'preferences' ? '设置与偏好' : 'API 集成'}
                  </button>
                ))}
              </div>
            </CardHeader>

            {activeTab === 'binding' && (
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-sm font-medium">邮箱</p><p className="text-xs text-muted-foreground">user@example.com · 已绑定</p></div>
                  </div>
                  <Badge variant="success" className="text-xs"><Check className="h-3 w-3 mr-1" />已绑定</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-sm font-medium">手机号</p><p className="text-xs text-muted-foreground">绑定手机号以提升账户安全</p></div>
                  </div>
                  <Button variant="outline" size="sm">绑定</Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-sm font-medium">GitHub</p><p className="text-xs text-muted-foreground">使用 GitHub OAuth 登录</p></div>
                  </div>
                  <Badge variant="success" className="text-xs"><Check className="h-3 w-3 mr-1" />已绑定</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-sm font-medium">微信</p><p className="text-xs text-muted-foreground">绑定微信账号</p></div>
                  </div>
                  <Button variant="outline" size="sm">绑定</Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-sm font-medium">企业 SSO</p><p className="text-xs text-muted-foreground">SAML / OIDC 企业单点登录</p></div>
                  </div>
                  <Badge variant="secondary" className="text-xs">高级</Badge>
                </div>
              </CardContent>
            )}

            {activeTab === 'preferences' && (
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">界面语言</p>
                  <div className="flex gap-2">
                    {languages.map(l => (
                      <button key={l.code} onClick={() => setLang(l.code)}
                        className={cn('px-3 py-1.5 rounded-lg border text-sm transition-all',
                          lang === l.code ? 'border-primary bg-primary/5 text-primary' : 'hover:border-muted-foreground/30'
                        )}>{l.label}</button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">API 错误语言</p>
                  <div className="flex gap-2">
                    <button className={cn('px-3 py-1.5 rounded-lg border text-sm transition-all', 'border-primary bg-primary/5 text-primary')}>跟随界面</button>
                    <button className='px-3 py-1.5 rounded-lg border text-sm transition-all hover:border-muted-foreground/30'>独立设置</button>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">时区</p>
                    <select value={tz} onChange={(e) => setTz(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border bg-background text-sm">
                      {timezones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">默认货币</p>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border bg-background text-sm">
                      {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">通知偏好</p>
                  <div className="space-y-2">
                    {[{ label: '邮件通知', key: 'email' }, { label: '短信通知', key: 'sms' }, { label: 'Webhook', key: 'webhook' }, { label: '系统通知', key: 'system' }].map(n => (
                      <label key={n.key} className="flex items-center justify-between">
                        <span className="text-sm">{n.label}</span>
                        <input type="checkbox" defaultChecked={n.key === 'email' || n.key === 'system'}
                          className="rounded border-gray-300" />
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}

            {activeTab === 'integrations' && (
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="grid gap-3">
                  {integrations.map(integration => (
                    <div key={integration.name} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{integration.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{integration.name}</p>
                          {integration.scope && <p className="text-xs text-muted-foreground">{integration.scope}</p>}
                        </div>
                      </div>
                      {integration.status === '已连接' ? (
                        <Badge variant="success" className="text-xs"><Check className="h-3 w-3 mr-1" />已连接</Badge>
                      ) : (
                        <Button variant="outline" size="sm">连接</Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Security Center */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> 安全中心</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm font-medium">登录密码</p><p className="text-xs text-muted-foreground">建议使用高强度密码</p></div>
                </div>
                <Button variant="outline" size="sm">修改</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm font-medium">双重验证 2FA</p><p className="text-xs text-amber-600">建议开启双重验证保护账户</p></div>
                </div>
                <Button variant="outline" size="sm">开启</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm font-medium">IP 访问限制</p><p className="text-xs text-muted-foreground">限制可访问 API 的 IP 地址</p></div>
                </div>
                <Button variant="outline" size="sm">配置</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm font-medium">异地登录提醒</p><p className="text-xs text-muted-foreground">检测到新设备或新地点时通知</p></div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Login Records */}
          <Card>
            <CardHeader><CardTitle className="text-base"><Clock className="h-4 w-4 inline mr-2" />登录记录</CardTitle></CardHeader>
            <CardContent className="p-0 sm:p-6">
              <DataTable
                columns={[
                  { key: 'time', label: '时间' },
                  { key: 'ip', label: 'IP' },
                  { key: 'device', label: '设备', hideOnMobile: true },
                  { key: 'location', label: '地区', hideOnMobile: true },
                  { key: 'status', label: '状态', render: (r) => <Badge variant="success" className="text-xs">成功</Badge> },
                ]}
                data={loginRecords}
                loading={false}
                page={1}
                total={loginRecords.length}
                onPageChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Growth Panel */}
        <div className="space-y-4 sm:space-y-6">
          {/* Daily Check-in */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> 每日签到</CardTitle></CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl mb-2">{checkedIn ? '🎉' : '⭐'}</div>
              <p className="font-semibold">{checkedIn ? '今日已签到' : '签到获取奖励'}</p>
              <div className="flex justify-center gap-1 my-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border',
                    i < checkDays ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                  )}>{i < checkDays ? '✓' : i + 1}</div>
                ))}
              </div>
              {!checkedIn && (
                <Button size="sm" className="w-full" onClick={() => { setCheckedIn(true); toast.success('签到成功！获得成长值 +10'); }}>
                  <Star className="h-4 w-4 mr-1" /> 立即签到
                </Button>
              )}
              <div className="mt-3 text-xs text-muted-foreground">
                <p>连续签到 7 天 → BoostPack 券</p>
                <p>连续签到 30 天 → Token 奖励</p>
              </div>
            </CardContent>
          </Card>

          {/* Growth & Membership */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-purple-500" /> 会员成长</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{userLevel}</span>
                <Badge variant="outline" className="text-xs">Scale 套餐</Badge>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>成长值 {growthValue}</span>
                  <span>下一级 {growthNext}</span>
                </div>
                <Progress value={growthPct} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> API 折扣 85 折</p>
                <p className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> BoostPack 折扣 9 折</p>
                <p className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> 邀请返佣加成 +10%</p>
              </div>
            </CardContent>
          </Card>

          {/* Referral Quick */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gift className="h-4 w-4" /> 邀请中心</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Input value={`${window.location.origin}/register?aff_code=${user.username}`} readOnly className="text-xs" />
                <Button variant="outline" size="sm"><Copy className="h-3 w-3" /></Button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="font-bold">28</p><p className="text-xs text-muted-foreground">邀请</p></div>
                <div><p className="font-bold">¥1,246</p><p className="text-xs text-muted-foreground">返佣</p></div>
                <div><p className="font-bold">¥312</p><p className="text-xs text-muted-foreground">待结算</p></div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/invite')}>查看详情</Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader><CardTitle className="text-base text-red-600">危险操作</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-1" /> 退出登录
              </Button>
              <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                注销账号
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
