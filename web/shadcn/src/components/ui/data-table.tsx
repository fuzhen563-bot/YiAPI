import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Search, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onSearch?: (keyword: string) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  searchPlaceholder?: string;
  mobileRender?: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id?: number }>({
  columns, data, loading, page, total, pageSize = 10,
  onPageChange, onSearch, onDelete, onAdd, searchPlaceholder, mobileRender,
}: DataTableProps<T>) {
  const [keyword, setKeyword] = useState('');
  const totalPages = Math.ceil(total / pageSize);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  return (
    <div className="space-y-4">
      {onSearch && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(keyword)}
              placeholder={searchPlaceholder || '搜索...'}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onSearch(keyword)}>搜索</Button>
            {onAdd && (
              <Button size="sm" onClick={onAdd}>
                <Plus className="h-4 w-4 mr-1" /> 添加
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.filter(c => !c.hideOnMobile).map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {(onDelete) && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.filter(c => !c.hideOnMobile).map((col) => (
                    <td key={col.key} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                  <td className="px-4 py-3"><Skeleton className="h-8 w-20 ml-auto" /></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.filter(c => !c.hideOnMobile).length + (onDelete ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                  {columns.filter(c => !c.hideOnMobile).map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm">
                      {col.render ? col.render(item) : (item as any)[col.key] ?? '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id!)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">暂无数据</div>
        ) : (
          data.map((item) => mobileRender ? (
            <div key={item.id}>
              {mobileRender(item)}
            </div>
          ) : (
            <div key={item.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {columns.filter(c => !c.hideOnMobile).slice(0, 2).map((col) => (
                    <span key={col.key} className="text-sm font-medium truncate">
                      {col.render ? col.render(item) : (item as any)[col.key] ?? '-'}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onDelete && (
                    <Button variant="ghost" size="icon" onClick={() => onDelete(item.id!)} className="text-destructive h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => toggleExpand(item.id!)} className="h-8 w-8">
                    {expanded.has(item.id!) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {expanded.has(item.id!) && (
                <div className="pt-2 border-t space-y-2 text-sm">
                  {columns.filter(c => !c.hideOnMobile).slice(2).map((col) => (
                    <div key={col.key} className="flex justify-between">
                      <span className="text-muted-foreground">{col.label}</span>
                      <span className="font-medium text-right">
                        {col.render ? col.render(item) : (item as any)[col.key] ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground order-2 sm:order-1">共 {total} 条</p>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[4rem] text-center">{page} / {totalPages || 1}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
