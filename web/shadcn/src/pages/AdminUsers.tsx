import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Users, Search, Ban, Key, DollarSign, Eye, X, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatQuota, renderQuota } from '@/lib/utils';

interface User {
  id: number; username: string; display_name: string; email: string;
  role: number; status: number; quota: number; group: string;
  created_time: number; used_quota: number; request_count: number;
  inviter_id: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', email: '', role: 1 });

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/user/', { params: { p } });
      if (res.data.success) { setUsers(res.data.data || []); setTotal(res.data.total || 0) }
    } catch { toast.error('加载失败') }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { load(page) }, [page]);

  const handleAction = async (id: number, action: string) => {
    try {
      await api.post('/user/manage', { id, action });
      toast.success('操作成功');
      load(page);
    } catch { toast.error('操作失败') }
  };

  const handleAdjustBalance = async () => {
    if (!selected || !adjustAmount) return;
    try {
      const amount = parseInt(adjustAmount) * 1000000;
      await api.post('/user/manage', { id: selected.id, action: 'adjust_quota', quota: amount });
      toast.success('余额已调整');
      setSelected({ ...selected, quota: selected.quota + amount });
      setAdjustAmount('');
      load(page);
    } catch { toast.error('操作失败') }
  };

  const roleLabel = (role: number) =>
    role >= 100 ? '超级管理员' : role >= 10 ? '管理员' : '用户';

  const roleColor = (role: number) =>
    role >= 100 ? 'destructive' : role >= 10 ? 'default' : 'secondary';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6" /> 用户管理
        </h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> 新建用户</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">总用户</p><p className="text-xl font-bold">{total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">活跃</p><p className="text-xl font-bold text-green-600">{users.filter(u => u.status === 1).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">管理员</p><p className="text-xl font-bold">{users.filter(u => u.role >= 10).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">封禁</p><p className="text-xl font-bold text-red-600">{users.filter(u => u.status !== 1).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={[
              { key: 'id', label: 'UID' },
              { key: 'username', label: '用户名' },
              { key: 'email', label: '邮箱', hideOnMobile: true },
              { key: 'role', label: '角色', render: (u) => <Badge variant={roleColor(u.role) as any} className="text-xs">{roleLabel(u.role)}</Badge> },
              { key: 'status', label: '状态', render: (u) => (
                <Badge variant={u.status === 1 ? 'success' : 'destructive'} className="text-xs cursor-pointer"
                  onClick={() => handleAction(u.id, u.status === 1 ? 'disable' : 'enable')}>
                  {u.status === 1 ? '正常' : '封禁'}
                </Badge>
              )},
              { key: 'quota', label: '余额', render: (u) => renderQuota(u.quota) },
              { key: 'group', label: '分组', render: (u) => <Badge variant="outline" className="text-xs">{u.group || 'default'}</Badge> },
              { key: 'actions', label: '操作', render: (u) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelected(u)} title="查看详情">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleAction(u.id, 'delete')} title="删除">
                    <Ban className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )},
            ]}
            data={users}
            loading={loading}
            page={page}
            total={total}
            onPageChange={setPage}
            onSearch={(kw) => api.get('/user/search', { params: { keyword: kw } }).then(r => {
              if (r.data.success) { setUsers(r.data.data); setTotal(r.data.data?.length || 0) }
            })}
            searchPlaceholder="搜索用户名..."
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle className="flex items-center justify-between text-base">
              <span>新建用户</span>
              <button onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></button>
            </CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">用户名</label>
                <Input value={createForm.username} onChange={(e) => setCreateForm(p => ({ ...p, username: e.target.value }))} placeholder="用户名" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">密码</label>
                <Input type="password" value={createForm.password} onChange={(e) => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="至少8位" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">邮箱</label>
                <Input value={createForm.email} onChange={(e) => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="选填" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">角色</label>
                <select value={createForm.role} onChange={(e) => setCreateForm(p => ({ ...p, role: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value={1}>普通用户</option>
                  <option value={10}>管理员</option>
                  <option value={100}>超级管理员</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
                <Button onClick={async () => {
                  try {
                    await api.post('/user/', createForm);
                    toast.success('创建成功');
                    setShowCreate(false);
                    load(page);
                  } catch { toast.error('创建失败') }
                }}><Save className="h-4 w-4 mr-1" /> 创建</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-background border-l shadow-lg h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{selected.username}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">UID</span><span>{selected.id}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">显示名</span><span>{selected.display_name || '-'}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">邮箱</span><span>{selected.email || '-'}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">角色</span><Badge variant={roleColor(selected.role) as any} className="text-xs">{roleLabel(selected.role)}</Badge></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">状态</span><Badge variant={selected.status === 1 ? 'success' : 'destructive'} className="text-xs">{selected.status === 1 ? '正常' : '封禁'}</Badge></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">余额</span><span className="font-bold">{renderQuota(selected.quota)}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">已用额度</span><span>{renderQuota(selected.used_quota)}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">请求次数</span><span>{selected.request_count?.toLocaleString() || 0}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">分组</span><Badge variant="outline">{selected.group || 'default'}</Badge></div>
              </div>

              {/* Balance Adjustment */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">调整余额</p>
                <div className="flex gap-2">
                  <Input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="金额 (¥)" />
                  <Button size="sm" onClick={handleAdjustBalance}><DollarSign className="h-4 w-4 mr-1" />调整</Button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t space-y-2">
                <p className="text-sm font-medium mb-2">管理操作</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleAction(selected.id, selected.role >= 10 ? 'demote' : 'promote')}>
                    {selected.role >= 10 ? '降级为用户' : '升级为管理员'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAction(selected.id, selected.status === 1 ? 'disable' : 'enable')}>
                    {selected.status === 1 ? '封禁' : '解封'}
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => { handleAction(selected.id, 'delete'); setSelected(null); }}>
                    删除用户
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
