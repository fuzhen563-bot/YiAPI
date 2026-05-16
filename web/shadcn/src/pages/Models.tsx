import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { Search, Cuboid, X, Grid3X3 } from 'lucide-react';

interface Model {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

export default function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Model | null>(null);

  useEffect(() => {
    api.get('/models').then((res) => {
      if (res.data.success) {
        setModels(Array.isArray(res.data.data) ? res.data.data : []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = Array.isArray(models)
    ? models.filter((m) => m.id?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const grouped: Record<string, Model[]> = {};
  filtered.forEach((m) => {
    const prefix = m.id?.split('-')[0] || 'other';
    if (!grouped[prefix]) grouped[prefix] = [];
    grouped[prefix].push(m);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6" /> 模型广场
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">浏览所有可用模型</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索模型..." className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 sm:py-16 text-muted-foreground">
            <Cuboid className="h-10 w-10 sm:h-12 sm:w-12" />
            <p className="text-sm">暂无模型数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="mb-2 sm:mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="uppercase text-xs">{group}</Badge>
                <span className="text-xs text-muted-foreground">{items.length} 个模型</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {items.map((m) => (
                  <Badge
                    key={m.id}
                    variant="outline"
                    className="cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-accent transition-colors"
                    onClick={() => setSelected(m)}
                  >
                    {m.id}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-sm sm:max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Cuboid className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">{selected.id}</span>
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">对象类型</span>
                <span className="font-medium">{selected.object || 'model'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间</span>
                <span className="font-medium">{selected.created ? new Date(selected.created * 1000).toLocaleString() : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">所属组织</span>
                <span className="font-medium">{selected.owned_by || 'system'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
