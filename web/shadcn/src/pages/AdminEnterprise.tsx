import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Building2, Users, DollarSign, Receipt } from 'lucide-react';

export default function AdminEnterprise() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/', { params: { p: 1, order: 'quota' } }).then((res) => {
      if (res.data.success) {
        const all = res.data.data || [];
        setUsers(all.filter((u: any) => u.quota > 50000000 || u.role >= 10));
      }
    }).finally(() => setLoading(false));
  }, []);

  const totalQuota = users.reduce((s, u) => s + (u.quota || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-5 w-5 sm:h-6 sm:w-6" /> 企业客户
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <Users className="h-4 w-4 text-blue-500 mb-1" />
          <p className="text-xl font-bold">{users.length}</p>
          <p className="text-xs text-muted-foreground">企业客户</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <DollarSign className="h-4 w-4 text-green-500 mb-1" />
          <p className="text-xl font-bold">¥{(totalQuota / 1000000).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">总余额</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Badge className="h-4 w-4 text-amber-500 mb-1" />
          <p className="text-xl font-bold">{users.filter((u: any) => u.role >= 10).length}</p>
          <p className="text-xs text-muted-foreground">管理员账户</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Receipt className="h-4 w-4 text-purple-500 mb-1" />
          <p className="text-xl font-bold">--</p>
          <p className="text-xs text-muted-foreground">合同数</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">企业客户列表</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u.username}</p>
                      <p className="text-xs text-muted-foreground">{u.email || '无邮箱'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥{(u.quota / 1000000).toFixed(2)}</p>
                    <Badge variant={u.role >= 10 ? 'default' : 'secondary'} className="text-xs">
                      {u.role >= 10 ? '管理员' : '企业用户'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
