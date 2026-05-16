import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Ticket, Copy, Check, Plus, X, Save, Download } from 'lucide-react';

interface Redemption {
  id: number; name: string; key: string; quota: number;
  status: number; created_time: number; redeemed_time: number;
  count?: number;
}

export default function RedemptionPage() {
  const [items, setItems] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formQuota, setFormQuota] = useState('100');
  const [formCount, setFormCount] = useState('10');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/redemption/', { params: { p } });
      if (res.data.success) { setItems(res.data.data || []); setTotal(res.data.total || 0) }
    } catch { toast.error('加载失败') }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { load(page) }, [page]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try { await api.delete(`/redemption/${id}/`); toast.success('已删除'); load(page) }
    catch { toast.error('删除失败') }
  };

  const toggleStatus = async (id: number, status: number) => {
    try { await api.put('/redemption/', { id, status: status === 1 ? 0 : 1, status_only: true }); load(page) }
    catch { toast.error('操作失败') }
  };

  const copyKey = async (key: string, id: number) => {
    await navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleBatchCreate = async () => {
    if (!formName) { toast.error('请输入名称'); return; }
    const count = parseInt(formCount) || 1;
    const quota = parseInt(formQuota) * 1000000;
    if (count > 100) { toast.error('单次最多生成100个'); return; }
    setSaving(true);
    try {
      const res = await api.post('/redemption/', { name: formName, quota, count });
      if (res.data.success) {
        toast.success(`成功生成 ${count} 个兑换码`);
        setShowCreate(false);
        load(page);
      } else {
        toast.error(res.data.message || '生成失败');
      }
    } catch { toast.error('生成失败') }
    finally { setSaving(false) }
  };

  const exportCsv = () => {
    const csv = items.filter(i => i.status === 1).map(i => `${i.name},${i.key},${(i.quota / 1000000).toFixed(2)}`).join('\n');
    const blob = new Blob([`名称,兑换码,额度\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'redemption-codes.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Ticket className="h-5 w-5 sm:h-6 sm:w-6" /> 兑换码
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={items.length === 0}>
            <Download className="h-4 w-4 mr-1" /> 导出
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> 批量生成
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'name', label: '名称' },
              { key: 'key', label: '兑换码', render: (r) => (
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{r.key.substring(0, 16)}...</code>
                  <Button variant="ghost" size="icon" onClick={() => copyKey(r.key, r.id)} className="h-6 w-6">
                    {copied === r.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )},
              { key: 'quota', label: '额度', render: (r) => `¥${(r.quota / 1000000).toFixed(2)}` },
              { key: 'status', label: '状态', render: (r) => (
                <Badge variant={r.status === 1 ? 'success' : 'destructive'} className="cursor-pointer text-xs"
                  onClick={() => toggleStatus(r.id, r.status)}>
                  {r.status === 1 ? '有效' : '已用'}
                </Badge>
              )},
              { key: 'created_time', label: '创建时间', render: (r) => new Date(r.created_time * 1000).toLocaleDateString(), hideOnMobile: true },
            ]}
            data={items}
            loading={loading}
            page={page}
            total={total}
            onPageChange={setPage}
            onDelete={handleDelete}
            searchPlaceholder="搜索兑换码..."
          />
        </CardContent>
      </Card>

      {/* Batch Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">批量生成兑换码</h2>
                <button onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">名称</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="如：新人礼包、活动赠送" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">额度 (¥)</label>
                  <Input type="number" value={formQuota} onChange={(e) => setFormQuota(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">生成数量</label>
                  <Input type="number" value={formCount} onChange={(e) => setFormCount(e.target.value)} />
                </div>
              </div>
              <Separator />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
                <Button onClick={handleBatchCreate} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> {saving ? '生成中...' : `生成 ${formCount || 0} 个`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
