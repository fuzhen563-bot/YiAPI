import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Plus, X, Save, Award, Star } from 'lucide-react';
import { toast } from 'react-toastify';

interface Level {
  id: number; name: string; minExp: number; benefits: string[]; color: string;
}

export default function AdminLevels() {
  const [levels, setLevels] = useState<Level[]>([
    { id: 1, name: 'Lv.1 Bronze', minExp: 0, benefits: ['基础API折扣'], color: 'amber' },
    { id: 2, name: 'Lv.2 Silver', minExp: 1000, benefits: ['API折扣95折', 'BoostPack折扣'], color: 'gray' },
    { id: 3, name: 'Lv.3 Gold', minExp: 5000, benefits: ['API折扣9折', 'BoostPack折扣9折', '邀请加成+5%'], color: 'yellow' },
    { id: 4, name: 'Lv.4 Platinum', minExp: 20000, benefits: ['API折扣85折', 'BoostPack折扣85折', '邀请加成+10%', '专属支持'], color: 'blue' },
    { id: 5, name: 'Lv.5 Diamond', minExp: 50000, benefits: ['API折扣8折', 'BoostPack折扣8折', '邀请加成+15%', '专属支持', '定制模型'], color: 'purple' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Level | null>(null);
  const [form, setForm] = useState({ name: '', minExp: '0', benefits: '' });

  const openCreate = () => { setEditing(null); setForm({ name: '', minExp: '0', benefits: '' }); setShowForm(true); };
  const openEdit = (l: Level) => { setEditing(l); setForm({ name: l.name, minExp: String(l.minExp), benefits: l.benefits.join(', ') }); setShowForm(true); };
  const handleSave = () => {
    if (!form.name) { toast.error('请填写名称'); return; }
    const benefits = form.benefits.split(',').map(s => s.trim()).filter(Boolean);
    if (editing) { setLevels(l => l.map(x => x.id === editing.id ? { ...x, name: form.name, minExp: parseInt(form.minExp) || 0, benefits } : x)); toast.success('已更新'); }
    else { setLevels(l => [...l, { id: Date.now(), name: form.name, minExp: parseInt(form.minExp) || 0, benefits, color: 'blue' }]); toast.success('已创建'); }
    setShowForm(false);
  };
  const handleDelete = (id: number) => { if (confirm('确定删除？')) { setLevels(l => l.filter(x => x.id !== id)); toast.success('已删除'); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" /> 成长等级
        </h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 新建等级</Button>
      </div>
      <Card>
        <CardContent className="space-y-3">
          {levels.map(l => (
            <div key={l.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <Award className={`h-5 w-5 ${l.color === 'yellow' ? 'text-yellow-500' : l.color === 'purple' ? 'text-purple-500' : l.color === 'blue' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                <div>
                  <span className="font-medium">{l.name}</span>
                  <p className="text-xs text-muted-foreground">需 {l.minExp} 成长值 · {l.benefits.join('、')}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(l)}>编辑</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDelete(l.id)}>删除</Button>
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
              <div className="space-y-1.5"><label className="text-sm font-medium">名称</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="如: Lv.3 Gold" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">最小成长值</label><Input type="number" value={form.minExp} onChange={e => setForm(p => ({ ...p, minExp: e.target.value }))} /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">权益（逗号分隔）</label><Input value={form.benefits} onChange={e => setForm(p => ({ ...p, benefits: e.target.value }))} placeholder="API折扣9折, BoostPack折扣, 邀请加成" /></div>
              <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setShowForm(false)}>取消</Button><Button onClick={handleSave}><Save className="h-4 w-4 mr-1" />保存</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
