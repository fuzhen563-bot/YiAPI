import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Package } from 'lucide-react';

interface Plan {
  id: number; name: string; quota: number; price: number;
  duration_days: number; status: number; description: string;
}

export default function TokenPlan() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/plan/all', { params: { p } });
      if (res.data.success) { setPlans(res.data.data || []); setTotal(res.data.total || 0) }
    } catch { toast.error('加载失败') }
    finally { setLoading(false) }
  }, []);

  useEffect(() => { load(page) }, [page]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try { await api.delete(`/plan/${id}`); toast.success('已删除'); load(page) }
    catch { toast.error('删除失败') }
  };

  const toggleStatus = async (id: number, status: number) => {
    try { await api.put('/plan/', { id, status: status === 1 ? 0 : 1 }); load(page) }
    catch { toast.error('操作失败') }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Package className="h-6 w-6" /> 套餐管理</h1>
        <p className="text-sm text-muted-foreground">管理 Token 套餐</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'name', label: '名称' },
              { key: 'quota', label: '额度', render: (p) => `¥${(p.quota / 1000000).toFixed(2)}` },
              { key: 'price', label: '价格', render: (p) => `¥${p.price}` },
              { key: 'duration_days', label: '有效期', render: (p) => `${p.duration_days}天` },
              { key: 'status', label: '状态', render: (p) => (
                <Badge variant={p.status === 1 ? 'success' : 'destructive'} className="cursor-pointer"
                  onClick={() => toggleStatus(p.id, p.status)}>
                  {p.status === 1 ? '上架' : '下架'}
                </Badge>
              )},
            ]}
            data={plans}
            loading={loading}
            page={page}
            total={total}
            onPageChange={setPage}
            onDelete={handleDelete}
            searchPlaceholder="搜索套餐..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
