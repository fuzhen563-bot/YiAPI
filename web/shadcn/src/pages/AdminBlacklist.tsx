import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Ban, Search, AlertTriangle, CheckCircle } from 'lucide-react';

interface User {
  id: number; username: string; email: string; status: number; role: number;
}

export default function AdminBlacklist() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const load = (p: number) => {
    setLoading(true);
    api.get('/user/', { params: { p } }).then((res) => {
      if (res.data?.success) { setUsers(res.data.data || []); setTotal(res.data.total || 0) }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(page) }, [page]);

  const toggleBan = async (id: number, currentStatus: number) => {
    try {
      await api.post('/user/manage', { id, action: currentStatus === 1 ? 'disable' : 'enable' });
      toast.success(currentStatus === 1 ? '已封禁' : '已解封');
      load(page);
    } catch { toast.error('操作失败') }
  };

  const banned = users.filter(u => u.status !== 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Ban className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" /> 黑名单
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">管理被封禁的用户</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs text-muted-foreground">已封禁</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{banned.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs text-muted-foreground">总用户</p>
            <p className="text-xl sm:text-2xl font-bold mt-1">{total || users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs text-muted-foreground">封禁率</p>
            <p className="text-xl sm:text-2xl font-bold mt-1">
              {(total || users.length) > 0 ? ((banned.length / (total || users.length)) * 100).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs text-muted-foreground">状态</p>
            <p className="text-sm sm:text-base font-medium mt-1 text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> 运行中
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索用户名..." className="pl-9"
              onKeyDown={(e) => e.key === 'Enter' && api.get('/user/search', { params: { keyword: search } }).then(r => {
                if (r.data?.success) { setUsers(r.data.data || []); setTotal(r.data.data?.length || 0) }
              }).catch(() => {})} />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <DataTable
              columns={[
                { key: 'id', label: 'UID' },
                { key: 'username', label: '用户名' },
                { key: 'email', label: '邮箱', hideOnMobile: true },
                { key: 'status', label: '状态', render: (u) => (
                  <Badge variant={u.status === 1 ? 'success' : 'destructive'} className="text-xs whitespace-nowrap">
                    {u.status === 1 ? '正常' : '封禁'}
                  </Badge>
                )},
                { key: 'actions', label: '操作', render: (u) => (
                  <Button variant={u.status === 1 ? 'destructive' : 'outline'} size="sm" className="h-7 text-xs"
                    onClick={() => toggleBan(u.id, u.status)}>
                    {u.status === 1 ? <Ban className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                    {u.status === 1 ? '封禁' : '解封'}
                  </Button>
                )},
              ]}
              data={users}
              loading={false}
              page={page}
              total={total}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
