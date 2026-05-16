import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Cable, Plus, X, Save, Edit3, Copy, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Channel {
  id: number; type: number; name: string; key: string; base_url?: string;
  models: string; status: number; priority: number; weight: number;
  created_time: number; response_time?: number;
}

const channelTypes: Record<number, string> = {
  1:'OpenAI', 3:'Azure', 5:'ChatGLM', 7:'讯飞', 8:'智谱',
  11:'PaLM2', 14:'Anthropic', 15:'百度', 17:'阿里通义', 24:'Gemini',
  28:'Mistral', 33:'AWS', 41:'Novita', 50:'OpenAI兼容', 51:'Gemini(OpenAI)',
  47:'百度V2', 40:'字节火山',
};

const CHANNEL_OPTIONS = Object.entries(channelTypes).map(([k, v]) => ({ value: parseInt(k), label: v }));

export default function Channel() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [saving, setSaving] = useState(false);
  const [testId, setTestId] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<number | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);

  // Form fields
  const [fType, setFType] = useState(1);
  const [fName, setFName] = useState('');
  const [fKey, setFKey] = useState('');
  const [fBaseUrl, setFBaseUrl] = useState('');
  const [fModels, setFModels] = useState('');
  const [fPriority, setFPriority] = useState('0');
  const [fWeight, setFWeight] = useState('0');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/channel/', { params: { p } });
      if (res.data.success) { setChannels(res.data.data || []); setTotal(res.data.total || 0) }
    } catch { toast.error('加载失败') }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { load(page) }, [page]);

  const resetForm = () => {
    setEditing(null); setFType(1); setFName(''); setFKey(''); setFBaseUrl('');
    setFModels(''); setFPriority('0'); setFWeight('0');
  };

  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (ch: Channel) => {
    setEditing(ch); setFType(ch.type); setFName(ch.name); setFKey(ch.key);
    setFBaseUrl(ch.base_url || ''); setFModels(ch.models || '');
    setFPriority(String(ch.priority)); setFWeight(String(ch.weight)); setShowForm(true);
  };

  const handleSave = async () => {
    if (!fName || !fKey) { toast.error('名称和Key必填'); return; }
    setSaving(true);
    try {
      const body = {
        id: editing?.id, type: fType, name: fName, key: fKey,
        base_url: fBaseUrl || undefined, models: fModels,
        priority: parseInt(fPriority) || 0, weight: parseInt(fWeight) || 0,
      };
      if (editing) {
        await api.put('/channel/', body); toast.success('已更新');
      } else {
        await api.post('/channel/', body); toast.success('已创建');
      }
      setShowForm(false); load(page);
    } catch (err: any) { toast.error(err.response?.data?.message || '操作失败') }
    finally { setSaving(false) }
  };

  const handleFetchModels = async () => {
    if (!fKey) { toast.error('请先填写 API Key'); return; }
    setFetchingModels(true);
    try {
      const res = await api.post('/channel/fetch-models', { type: fType, key: fKey, base_url: fBaseUrl });
      if (res.data.success && Array.isArray(res.data.data)) {
        setFModels(res.data.data.join(','));
        toast.success(`获取到 ${res.data.data.length} 个模型`);
      } else {
        toast.error(res.data.message || '获取失败');
      }
    } catch { toast.error('获取模型列表失败') }
    finally { setFetchingModels(false) }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该渠道？')) return;
    try { await api.delete(`/channel/${id}/`); toast.success('已删除'); load(page) }
    catch { toast.error('删除失败') }
  };

  const toggleStatus = async (id: number, status: number) => {
    try { await api.put('/channel/', { id, status: status === 1 ? 0 : 1 }); load(page) }
    catch { toast.error('操作失败') }
  };

  const testChannel = async (id: number) => {
    setTestId(id);
    try {
      const res = await api.get(`/channel/test/${id}`);
      toast.success(res.data.success ? '测试通过' : `失败: ${res.data.message}`);
    } catch { toast.error('测试失败') }
    finally { setTestId(null) }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Cable className="h-5 w-5 sm:h-6 sm:w-6" /> 渠道管理
        </h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 新建渠道</Button>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'type', label: '类型', render: (c) => <Badge variant="outline" className="text-xs">{channelTypes[c.type] || `类型${c.type}`}</Badge> },
              { key: 'name', label: '名称' },
              { key: 'models', label: '模型', render: (c) => (
                <div className="flex gap-1 flex-wrap max-w-[200px]">
                  {c.models?.split(',').slice(0, 2).map(m => <Badge key={m} variant="secondary" className="text-[10px]">{m.trim()}</Badge>)}
                  {(c.models?.split(',').length || 0) > 2 && <Badge variant="outline" className="text-[10px]">+{c.models!.split(',').length - 2}</Badge>}
                </div>
              )},
              { key: 'status', label: '状态', render: (c) => (
                <Badge variant={c.status === 1 ? 'success' : 'destructive'} className="cursor-pointer text-xs"
                  onClick={() => toggleStatus(c.id, c.status)}>{c.status === 1 ? '启用' : '禁用'}</Badge>
              )},
              { key: 'actions', label: '操作', render: (c) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(c)}>编辑</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => testChannel(c.id)} disabled={testId === c.id}>
                    {testId === c.id ? '测试中' : '测试'}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDelete(c.id)}>删除</Button>
                </div>
              )},
            ]}
            data={channels}
            loading={loading}
            page={page}
            total={total}
            onPageChange={setPage}
            onSearch={(kw) => api.get('/channel/search', { params: { keyword: kw } }).then(r => {
              if (r.data.success) { setChannels(r.data.data); setTotal(r.data.data?.length || 0) }
            })}
            searchPlaceholder="搜索渠道名称..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{editing ? '编辑渠道' : '新建渠道'}</h2>
                <button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">渠道类型</label>
                  <select value={fType} onChange={(e) => setFType(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                    {CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">名称</label>
                  <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="渠道名称" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">API Key</label>
                <Input value={fKey} onChange={(e) => setFKey(e.target.value)} placeholder="sk-..." type="password" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Base URL</label>
                <Input value={fBaseUrl} onChange={(e) => setFBaseUrl(e.target.value)} placeholder="https://api.openai.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">模型列表</label>
                <div className="flex gap-2">
                  <Input value={fModels} onChange={(e) => setFModels(e.target.value)} placeholder="gpt-4o,gpt-4o-mini" className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={handleFetchModels} disabled={fetchingModels} className="shrink-0">
                    <RefreshCw className={`h-4 w-4 mr-1 ${fetchingModels ? 'animate-spin' : ''}`} />
                    {fetchingModels ? '获取中...' : '获取模型'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">优先级</label>
                  <Input type="number" value={fPriority} onChange={(e) => setFPriority(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">权重</label>
                  <Input type="number" value={fWeight} onChange={(e) => setFWeight(e.target.value)} />
                </div>
              </div>

              <Separator />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> {saving ? '保存中...' : editing ? '更新' : '创建'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
