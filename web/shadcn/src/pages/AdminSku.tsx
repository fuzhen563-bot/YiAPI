import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Zap, Plus, X, Save, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: number; name: string; quota: number; price: number;
  duration_days: number; status: number; description: string;
}

export default function AdminSku() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formQuota, setFormQuota] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDays, setFormDays] = useState('30');

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/plan/all', { params: { p } });
      if (res.data.success) { setPlans(res.data.data || []); setTotal(res.data.total || 0) }
    } catch { toast.error('加载失败') }
    finally { setLoading(false) }
  };

  useEffect(() => { load(page) }, [page]);

  const openCreate = () => {
    setEditing(null); setFormName(''); setFormDesc(''); setFormQuota(''); setFormPrice(''); setFormDays('30'); setShowForm(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p); setFormName(p.name); setFormDesc(p.description || '');
    setFormQuota(String(p.quota)); setFormPrice(String(p.price)); setFormDays(String(p.duration_days)); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName || !formQuota || !formPrice) { toast.error('请填写完整'); return }
    setSaving(true);
    try {
      const body = {
        id: editing?.id, name: formName, description: formDesc,
        quota: parseInt(formQuota), price: parseInt(formPrice),
        duration_days: parseInt(formDays),
      };
      if (editing) {
        await api.put('/plan/', body); toast.success('已更新');
      } else {
        await api.post('/plan/', body); toast.success('已创建');
      }
      setShowForm(false); load(page);
    } catch { toast.error('操作失败') }
    finally { setSaving(false) }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try { await api.delete(`/plan/${id}`); toast.success('已删除'); load(page) }
    catch { toast.error('删除失败') }
  };

  const toggleStatus = async (id: number, status: number) => {
    try { await api.put('/plan/', { id, status: status === 1 ? 0 : 1 }); load(page) }
    catch { toast.error('操作失败') }
  };

  const durations = [
    { label: '按月', days: 30 }, { label: '按季', days: 90 }, { label: '按年', days: 365 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-5 w-5 sm:h-6 sm:w-6" /> SKU 管理
        </h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 新建套餐</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? <Skeleton className="h-48 w-full" /> : plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">暂无套餐，点击「新建套餐」创建</div>
          ) : (
            <div className="space-y-3">
              {plans.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <Badge variant={p.status === 1 ? 'success' : 'secondary'} className="text-xs cursor-pointer"
                        onClick={() => toggleStatus(p.id, p.status)}>
                        {p.status === 1 ? '上架' : '下架'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ¥{p.price} / {(p.duration_days === 30 ? '月' : p.duration_days === 90 ? '季' : p.duration_days === 365 ? '年' : p.duration_days + '天')}
                      {' · '}{(p.quota / 1000000).toFixed(0)}M Tokens
                      {p.description ? ` · ${p.description}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(p)}>编辑</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDelete(p.id)}>删除</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{editing ? '编辑套餐' : '新建套餐'}</span>
                <button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">套餐名称</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="如：Starter, Pro" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">描述</label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="简短描述" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Token 配额</label>
                  <Input type="number" value={formQuota} onChange={(e) => setFormQuota(e.target.value)} placeholder="如：10000000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">价格 (¥)</label>
                  <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="如：79" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">有效期</label>
                <div className="flex gap-2">
                  {durations.map(d => (
                    <button key={d.days} onClick={() => setFormDays(String(d.days))}
                      className={cn('flex-1 px-3 py-2 rounded-lg border text-sm transition-all',
                        formDays === String(d.days) ? 'border-primary bg-primary/5 text-primary' : 'hover:border-muted-foreground/30'
                      )}>{d.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> {saving ? '保存中...' : '保存'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
