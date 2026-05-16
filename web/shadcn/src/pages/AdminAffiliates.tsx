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
import { Gift, Users, DollarSign, TrendingUp, Search } from 'lucide-react';

interface Commission {
  id: number; user_id: number; invited_user_id: number;
  amount: number; status: number; created_at: number;
  invited_username?: string;
}

interface User {
  id: number; username: string; inviter_id: number; quota: number;
}

export default function AdminAffiliates() {
  const [users, setUsers] = useState<User[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/user/', { params: { p: 1, order: 'id' } }),
    ]).then(([uRes]) => {
      if (uRes.data.success) setUsers(uRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const inviterCount = users.filter(u => u.inviter_id > 0).length;
  const totalCommission = users.reduce((s, u) => s + (u.quota > 1000000 ? 1 : 0), 0) * 50;

  const filtered = users.filter(u => {
    if (!search) return u.inviter_id > 0;
    return u.username?.toLowerCase().includes(search.toLowerCase()) || String(u.inviter_id).includes(search);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Gift className="h-5 w-5 sm:h-6 sm:w-6" /> 邀请系统
        </h1>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{users.filter(u => u.inviter_id > 0).length}</p>
          <p className="text-xs text-muted-foreground">被邀请用户</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{new Set(users.filter(u => u.inviter_id > 0).map(u => u.inviter_id)).size}</p>
          <p className="text-xs text-muted-foreground">邀请人</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <DollarSign className="h-5 w-5 mx-auto mb-1 text-amber-500" />
          <p className="text-2xl font-bold">¥{totalCommission.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">预估返佣</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold">{users.length > 0 ? ((inviterCount / users.length) * 100).toFixed(1) : '0'}%</p>
          <p className="text-xs text-muted-foreground">邀请转化率</p>
        </CardContent></Card>
      </div>

      {/* Invited users table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索用户名..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <DataTable
              columns={[
                { key: 'id', label: 'UID' },
                { key: 'username', label: '被邀请用户' },
                { key: 'inviter_id', label: '邀请人 UID' },
                { key: 'quota', label: '余额', render: (u) => `¥${(u.quota / 1000000).toFixed(2)}` },
                { key: 'status', label: '状态', render: () => <Badge variant="success" className="text-xs">已注册</Badge> },
              ]}
              data={filtered}
              loading={false}
              page={1}
              total={filtered.length}
              onPageChange={() => {}}
            />
          )}
        </CardContent>
      </Card>

      {/* Commission rules */}
      <Card>
        <CardHeader><CardTitle className="text-base">返佣规则配置</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="text-muted-foreground">邀请人奖励</span>
            <span className="font-medium">¥0.50 / 人</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="text-muted-foreground">被邀请人奖励</span>
            <span className="font-medium">¥0.50 / 人</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="text-muted-foreground">结算方式</span>
            <span className="font-medium">自动结算</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
