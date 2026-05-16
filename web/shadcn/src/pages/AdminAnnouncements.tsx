import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Bell, Plus, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Announcement {
  id: number; title: string; content: string; priority: number;
  status: number; created_at: number;
}

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/announcement/all', { params: { p } });
      if (res.data.success) { setItems(res.data.data || []); setTotal(res.data.total || 0) }
    } catch { toast.error('加载失败') }
    finally { setLoading(false) }
  };

  useEffect(() => { load(page) }, [page]);

  const openCreate = () => {
    setEditing(null); setFormTitle(''); setFormContent(''); setFormPriority(0); setShowForm(true);
  };

  const openEdit = (item: Announcement) => {
    setEditing(item); setFormTitle(item.title); setFormContent(item.content); setFormPriority(item.priority); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) { toast.error('请填写完整'); return }
    setSaving(true);
    try {
      if (editing) {
        await api.put('/announcement/', { id: editing.id, title: formTitle, content: formContent, priority: formPriority });
        toast.success('已更新');
      } else {
        await api.post('/announcement/', { title: formTitle, content: formContent, priority: formPriority });
        toast.success('已创建');
      }
      setShowForm(false); load(page);
    } catch { toast.error('操作失败') }
    finally { setSaving(false) }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try { await api.delete(`/announcement/${id}`); toast.success('已删除'); load(page) }
    catch { toast.error('删除失败') }
  };

  const togglePriority = async (id: number, priority: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      await api.put('/announcement/', { id, title: item.title, content: item.content, priority: priority === 1 ? 0 : 1 });
      load(page);
    } catch { toast.error('操作失败') }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" /> 公告管理
          </h1>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 新建公告</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'title', label: '标题' },
              { key: 'priority', label: '优先级', render: (a) => (
                <Badge variant={a.priority === 1 ? 'warning' : 'secondary'} className="cursor-pointer text-xs"
                  onClick={() => togglePriority(a.id, a.priority)}>
                  {a.priority === 1 ? '重要' : '普通'}
                </Badge>
              )},
              { key: 'created_at', label: '创建时间', render: (a) => new Date(a.created_at * 1000).toLocaleDateString() },
              { key: 'actions', label: '操作', render: (a) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(a)}>编辑</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDelete(a.id)}>删除</Button>
                </div>
              )},
            ]}
            data={items}
            loading={loading}
            page={page}
            total={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{editing ? '编辑公告' : '新建公告'}</span>
                <button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">标题</label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="公告标题" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">内容</label>
                <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)}
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder="公告内容" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">优先级</label>
                <div className="flex gap-2">
                  {[{ v: 0, l: '普通' }, { v: 1, l: '重要' }].map(p => (
                    <button key={p.v} onClick={() => setFormPriority(p.v)}
                      className={cn('px-3 py-1.5 rounded-lg border text-sm transition-all',
                        formPriority === p.v ? 'border-primary bg-primary/5 text-primary' : ''
                      )}>{p.l}</button>
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
