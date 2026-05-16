import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Globe, Plus, X, Save, Shield } from 'lucide-react';
import { toast } from 'react-toastify';

interface IpRule {
  id: number; cidr: string; comment: string; status: number; created_at: string;
}

export default function AdminIpWhitelist() {
  const [rules, setRules] = useState<IpRule[]>([
    { id: 1, cidr: '192.168.1.0/24', comment: '内网', status: 1, created_at: '2026-05-01' },
    { id: 2, cidr: '10.0.0.0/8', comment: 'VPN', status: 1, created_at: '2026-05-01' },
    { id: 3, cidr: '203.0.113.0/24', comment: '办公室', status: 0, created_at: '2026-05-10' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cidr: '', comment: '' });

  const addRule = () => {
    if (!form.cidr) { toast.error('请输入 CIDR'); return; }
    setRules(r => [...r, { id: Date.now(), ...form, status: 1, created_at: new Date().toISOString().split('T')[0] }]);
    setForm({ cidr: '', comment: '' }); setShowForm(false); toast.success('已添加');
  };
  const toggleRule = (id: number) => { setRules(r => r.map(x => x.id === id ? { ...x, status: x.status === 1 ? 0 : 1 } : x)); };
  const deleteRule = (id: number) => { if (confirm('确定删除？')) { setRules(r => r.filter(x => x.id !== id)); toast.success('已删除'); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="h-5 w-5 sm:h-6 sm:w-6" /> IP 白名单
        </h1>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> 添加规则</Button>
      </div>
      <Card>
        <CardHeader><p className="text-sm text-muted-foreground">管理 API 访问 IP 白名单，仅允许指定 IP 段访问</p></CardHeader>
        <CardContent className="space-y-2">
          {rules.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <Shield className={`h-4 w-4 ${r.status === 1 ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div><code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{r.cidr}</code><span className="text-xs text-muted-foreground ml-2">{r.comment}</span></div>
              </div>
              <div className="flex gap-1">
                <Badge variant={r.status === 1 ? 'success' : 'secondary'} className="cursor-pointer text-xs" onClick={() => toggleRule(r.id)}>{r.status === 1 ? '启用' : '禁用'}</Badge>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => deleteRule(r.id)}>删除</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between"><h2 className="font-semibold">添加 IP 规则</h2><button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">CIDR</label><Input value={form.cidr} onChange={e => setForm(p => ({ ...p, cidr: e.target.value }))} placeholder="192.168.1.0/24" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">备注</label><Input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} placeholder="如：办公室网络" /></div>
              <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setShowForm(false)}>取消</Button><Button onClick={addRule}><Save className="h-4 w-4 mr-1" />添加</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
