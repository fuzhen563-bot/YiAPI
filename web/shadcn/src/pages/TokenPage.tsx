import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Key, Copy, Check, Plus, X, Gauge, Shield, Cpu, Globe, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Token {
  id: number; name: string; key: string; status: number;
  created_time: number; accessed_time: number; expired_time: number;
  remain_quota: number; unlimited_quota: boolean;
  models?: string; subnet?: string;
}

export default function TokenPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formModels, setFormModels] = useState('');
  const [formRpm, setFormRpm] = useState('');
  const [formTpm, setFormTpm] = useState('');
  const [formSubnet, setFormSubnet] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formUnlimited, setFormUnlimited] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/token/', { params: { p } });
      if (res.data.success) { setTokens(res.data.data || []); setTotal(res.data.total || 0) }
    } catch { toast.error('加载失败') }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { load(page) }, [page]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try { await api.delete(`/token/${id}/`); toast.success('已删除'); load(page) }
    catch { toast.error('删除失败') }
  };

  const toggleStatus = async (id: number, status: number) => {
    try { await api.put('/token/', { id, status: status === 1 ? 0 : 1, status_only: true }); load(page) }
    catch { toast.error('操作失败') }
  };

  const copyKey = async (key: string, id: number) => {
    await navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async () => {
    if (!formName.trim()) { toast.error('请输入密钥名称'); return }
    setCreating(true);
    try {
      const payload: any = { name: formName.trim() };
      payload.models = formModels || null;
      payload.subnet = formSubnet || null;
      if (formUnlimited) {
        payload.unlimited_quota = true;
      } else {
        payload.remain_quota = parseInt(formBudget) * 1000000 || 0;
        payload.unlimited_quota = false;
      }
      const res = await api.post('/token/', payload);
      if (res.data.success) {
        toast.success('创建成功');
        setShowCreate(false);
        resetForm();
        load(page);
      } else {
        toast.error(res.data.message || '创建失败');
      }
    } catch { toast.error('创建失败') }
    finally { setCreating(false) }
  };

  const resetForm = () => {
    setFormName(''); setFormModels(''); setFormRpm(''); setFormTpm('');
    setFormSubnet(''); setFormBudget(''); setFormUnlimited(true);
  };

  const popularModels = ['gpt-4o','gpt-4o-mini','gpt-4','gpt-3.5-turbo','claude-3-opus','claude-3-sonnet','claude-3-haiku','gemini-pro','deepseek-chat'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Key className="h-5 w-5 sm:h-6 sm:w-6" /> API 密钥
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">管理 API 访问令牌</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> 创建密钥
        </Button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">创建 API 密钥</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Key Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5"><Key className="h-3.5 w-3.5" /> 密钥名称</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="例如：生产环境、开发测试" />
                </div>

                {/* Model Permissions */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" /> 模型权限</label>
                  <Input value={formModels} onChange={(e) => setFormModels(e.target.value)} placeholder="留空表示允许所有模型，逗号分隔" />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {popularModels.map(m => (
                      <Badge key={m} variant={formModels.includes(m) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          const list = formModels ? formModels.split(',').map(s => s.trim()) : [];
                          if (list.includes(m)) {
                            setFormModels(list.filter(s => s !== m).join(','));
                          } else {
                            list.push(m);
                            setFormModels(list.join(','));
                          }
                        }}
                      >{m}</Badge>
                    ))}
                  </div>
                </div>

                {/* Rate Limits */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> RPM 限制</label>
                    <Input value={formRpm} onChange={(e) => setFormRpm(e.target.value)} placeholder="不限制" type="number" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> TPM 限制</label>
                    <Input value={formTpm} onChange={(e) => setFormTpm(e.target.value)} placeholder="不限制" type="number" />
                  </div>
                </div>

                {/* IP Whitelist */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> IP 白名单</label>
                  <Input value={formSubnet} onChange={(e) => setFormSubnet(e.target.value)} placeholder="CIDR 格式，逗号分隔，如 192.168.1.0/24" />
                  <p className="text-xs text-muted-foreground">留空表示允许所有 IP</p>
                </div>

                {/* Budget Limit */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> 预算限制</label>
                  <div className="flex items-center gap-2">
                    <Input value={formBudget} onChange={(e) => setFormBudget(e.target.value)}
                      placeholder="金额 (¥)" type="number" disabled={formUnlimited}
                      className={formUnlimited ? 'opacity-50' : ''} />
                    <label className="flex items-center gap-1.5 text-sm whitespace-nowrap cursor-pointer">
                      <input type="checkbox" checked={formUnlimited} onChange={(e) => setFormUnlimited(e.target.checked)}
                        className="rounded border-gray-300" />
                      无限制
                    </label>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>取消</Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? '创建中...' : '创建密钥'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key List */}
      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={[
              { key: 'name', label: '名称' },
              { key: 'key', label: 'Key', render: (t) => (
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[180px] sm:max-w-[250px] font-mono">
                    sk-...{t.key.substring(t.key.length - 8)}
                  </code>
                  <Button variant="ghost" size="icon" onClick={() => copyKey(t.key, t.id)} className="h-7 w-7">
                    {copied === t.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )},
              { key: 'models', label: '模型权限', render: (t) => t.models ? (
                <div className="flex gap-1 flex-wrap max-w-[150px]">
                  {t.models.split(',').slice(0, 2).map(m => <Badge key={m} variant="secondary" className="text-[10px]">{m.trim()}</Badge>)}
                  {t.models.split(',').length > 2 && <Badge variant="outline" className="text-[10px]">+{t.models.split(',').length - 2}</Badge>}
                </div>
              ) : <span className="text-xs text-muted-foreground">全部</span> },
              { key: 'status', label: '状态', render: (t) => (
                <Badge variant={t.status === 1 ? 'success' : 'destructive'} className="cursor-pointer text-xs"
                  onClick={() => toggleStatus(t.id, t.status)}>
                  {t.status === 1 ? '启用' : '禁用'}
                </Badge>
              )},
              { key: 'remain_quota', label: '预算', render: (t) => t.unlimited_quota ? '无限制' : `¥${(t.remain_quota / 1000000).toFixed(2)}` },
              { key: 'created_time', label: '创建时间', render: (t) => new Date(t.created_time * 1000).toLocaleDateString(), hideOnMobile: true },
            ]}
            data={tokens}
            loading={loading}
            page={page}
            total={total}
            onPageChange={setPage}
            onSearch={(kw) => api.get('/token/search', { params: { keyword: kw } }).then(r => {
              if (r.data.success) { setTokens(r.data.data); setTotal(r.data.data?.length || 0) }
            })}
            onDelete={handleDelete}
            searchPlaceholder="搜索密钥名称..."
            mobileRender={(t) => (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{t.name}</span>
                  <Badge variant={t.status === 1 ? 'success' : 'destructive'} className="text-xs">{t.status === 1 ? '启用' : '禁用'}</Badge>
                </div>
                <code className="text-xs block bg-muted px-2 py-1 rounded truncate">sk-...{t.key.substring(t.key.length - 8)}</code>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t.unlimited_quota ? '无限制' : `¥${(t.remain_quota / 1000000).toFixed(2)}`}</span>
                  <span>{new Date(t.created_time * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
