import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Layers, Plus, X, Save, Shield } from 'lucide-react';

interface Tier {
  id: number; name: string; description: string; minQuota: number;
  discount: number; color: string; status: number;
}

export default function AdminUserTiers() {
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 1, name: 'Starter', description: '入门用户', minQuota: 0, discount: 0, color: 'gray', status: 1 },
    { id: 2, name: 'Builder', description: '进阶用户', minQuota: 10000000, discount: 5, color: 'blue', status: 1 },
    { id: 3, name: 'Scale', description: '高级用户', minQuota: 50000000, discount: 10, color: 'purple', status: 1 },
    { id: 4, name: 'Enterprise', description: '企业客户', minQuota: 200000000, discount: 20, color: 'gold', status: 1 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tier | null>(null);
  const [form, setForm] = useState({ name: '', description: '', minQuota: '0', discount: '0', color: 'blue' });

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', minQuota: '0', discount: '0', color: 'blue' }); setShowForm(true); };
  const openEdit = (t: Tier) => { setEditing(t); setForm({ name: t.name, description: t.description, minQuota: String(t.minQuota), discount: String(t.discount), color: t.color }); setShowForm(true); };
  const handleSave = () => {
    if (!form.name) { toast.error('请填写名称'); return; }
    if (editing) { setTiers(t => t.map(x => x.id === editing.id ? { ...x, ...form, minQuota: parseInt(form.minQuota) || 0, discount: parseInt(form.discount) || 0 } : x)); toast.success('已更新'); }
    else { setTiers(t => [...t, { id: Date.now(), ...form, minQuota: parseInt(form.minQuota) || 0, discount: parseInt(form.discount) || 0, status: 1 }]); toast.success('已创建'); }
    setShowForm(false);
  };
  const handleDelete = (id: number) => { if (confirm('确定删除？')) { setTiers(t => t.filter(x => x.id !== id)); toast.success('已删除'); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-5 w-5 sm:h-6 sm:w-6" /> 用户等级
        </h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 新建等级</Button>
      </div>
      <Card>
        <CardContent className="p-6 space-y-3">
          {tiers.map(t => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <Shield className={`h-5 w-5 ${t.color === 'blue' ? 'text-blue-500' : t.color === 'purple' ? 'text-purple-500' : t.color === 'gold' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                <div>
                  <span className="font-medium">{t.name}</span>
                  <p className="text-xs text-muted-foreground">{t.description} · 最低额度 ¥{(t.minQuota / 1000000).toFixed(0)} · 折扣 {t.discount}%</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(t)}>编辑</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDelete(t.id)}>删除</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between"><h2 className="font-semibold">{editing ? '编辑等级' : '新建等级'}</h2><button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">名称</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">描述</label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-sm font-medium">最低额度</label><Input type="number" value={form.minQuota} onChange={e => setForm(p => ({ ...p, minQuota: e.target.value }))} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">折扣 %</label><Input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} /></div>
              </div>
              <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setShowForm(false)}>取消</Button><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" />保存</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
