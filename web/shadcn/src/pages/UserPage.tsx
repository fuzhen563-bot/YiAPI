import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Users } from 'lucide-react';

interface User {
  id: number; username: string; display_name: string;
  role: number; status: number; quota: number;
  group: string; created_time: number;
}

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/user/', { params: { p } });
      if (res.data.success) { setUsers(res.data.data || []); setTotal(res.data.total || 0) }
    } catch { toast.error('加载失败') }
    finally { setLoading(false) }
  }, []);
  
  useEffect(() => { load(page) }, [page]);

  const roleLabel = (role: number) => role >= 100 ? '超级管理员' : role >= 10 ? '管理员' : '用户';

  const handleAction = async (id: number, action: string) => {
    try {
      await api.post('/user/manage', { id, action });
      toast.success('操作成功');
      load(page);
    } catch { toast.error('操作失败') }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Users className="h-6 w-6" /> 用户管理</h1>
        <p className="text-sm text-muted-foreground">管理系统用户</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'username', label: '用户名' },
              { key: 'display_name', label: '显示名' },
              { key: 'role', label: '角色', render: (u) => (
                <Badge variant={u.role >= 100 ? 'destructive' : u.role >= 10 ? 'default' : 'secondary'}>
                  {roleLabel(u.role)}
                </Badge>
              )},
              { key: 'status', label: '状态', render: (u) => (
                <Badge variant={u.status === 1 ? 'success' : 'destructive'}>{u.status === 1 ? '正常' : '禁用'}</Badge>
              )},
              { key: 'quota', label: '额度', render: (u) => `¥${(u.quota / 1000000).toFixed(2)}` },
              { key: 'group', label: '分组', render: (u) => <Badge variant="outline">{u.group}</Badge> },
              { key: 'created_time', label: '注册时间', render: (u) => new Date(u.created_time * 1000).toLocaleDateString() },
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
            onAdd={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
}
