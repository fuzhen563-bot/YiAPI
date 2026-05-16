import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';
import { ScrollText, DollarSign, Package, RefreshCw } from 'lucide-react';

type OrderTab = 'all' | 'topup' | 'plan' | 'boostpack' | 'refund';

export default function AdminOrders() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [tab, setTab] = useState<OrderTab>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/log/', { params: { p: page } }),
      api.get('/payment/user', { params: { p: page } }).catch(() => ({ data: { data: [] } })),
    ]).then(([lRes]) => {
      if (lRes.data.success) setOrders(lRes.data.data || []);
    }).catch(() => toast.error('加载失败'))
    .finally(() => setLoading(false));
  }, [page]);

  const tabs = [
    { key: 'all', label: '全部', icon: ScrollText },
    { key: 'topup', label: '充值', icon: DollarSign },
    { key: 'plan', label: '套餐', icon: Package },
    { key: 'boostpack', label: '资源包', icon: Package },
    { key: 'refund', label: '退款', icon: RefreshCw },
  ];

  const totalRevenue = orders.reduce((s, o) => {
    if (o.type === 1) return s + (o.quota || 0);
    return s;
  }, 0);

  const totalOrders = orders.length;
  const successOrders = orders.filter(o => o.type === 1).length;
  const refundOrders = orders.filter(o => o.type === 4).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-5 w-5 sm:h-6 sm:w-6" /> 订单管理
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">查看和管理所有订单</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">总收入</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">¥{(totalRevenue / 1000000).toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">总订单</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{totalOrders}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">成功订单</p>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">{successOrders}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">退款</p>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-red-600">{refundOrders}</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap',
              tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          ><t.icon className="h-3.5 w-3.5" /> {t.label}</button>
        ))}
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0 sm:p-6">
          <DataTable
            columns={[
              { key: 'id', label: '订单号', render: (o) => <code className="text-xs">#{o.id}</code> },
              { key: 'created_at', label: '时间', render: (o) => new Date(o.created_at * 1000).toLocaleString() },
              { key: 'type', label: '类型', render: (o) => {
                const map: Record<number, { label: string; color: 'success' | 'destructive' | 'warning' | 'secondary' }> = {
                  1: { label: '充值', color: 'success' },
                  2: { label: '消耗', color: 'destructive' },
                  3: { label: '管理', color: 'warning' },
                  4: { label: '退款', color: 'secondary' },
                };
                const info = map[o.type] || { label: '其他', color: 'secondary' };
                return <Badge variant={info.color} className="text-xs">{info.label}</Badge>;
              }},
              { key: 'amount', label: '金额', render: (o) => `¥${(o.quota / 1000000).toFixed(2)}` },
              { key: 'model_name', label: '来源', render: (o) => o.model_name || o.content || '-' },
              { key: 'status', label: '状态', render: (o) => <Badge variant="success" className="text-xs">成功</Badge> },
            ]}
            data={orders}
            loading={loading}
            page={page}
            total={orders.length}
            onPageChange={setPage}
            searchPlaceholder="搜索订单号..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
