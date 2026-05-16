import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Shield, Plus, X, Save, Edit3 } from 'lucide-react';
import { toast } from 'react-toastify';

interface Role {
  id: number; name: string; description: string; userCount: number;
}

const defaultRoles: Role[] = [
  { id: 100, name: '超级管理员', description: '完全控制系统所有功能', userCount: 1 },
  { id: 10, name: '管理员', description: '管理系统设置和用户', userCount: 2 },
  { id: 1, name: '运营', description: '管理套餐、公告和内容', userCount: 0 },
  { id: 2, name: '财务', description: '管理订单、支付和发票', userCount: 0 },
  { id: 3, name: '客服', description: '管理工单和用户反馈', userCount: 0 },
  { id: 4, name: '风控', description: '管理黑名单和风险监控', userCount: 0 },
];

const permissions = [
  { key: 'dashboard', label: '仪表盘' },
  { key: 'users.view', label: '查看用户' },
  { key: 'users.edit', label: '编辑用户' },
  { key: 'users.delete', label: '删除用户' },
  { key: 'plans.manage', label: '管理套餐' },
  { key: 'orders.view', label: '查看订单' },
  { key: 'orders.refund', label: '退款操作' },
  { key: 'payment.configure', label: '配置支付' },
  { key: 'models.manage', label: '管理模型' },
  { key: 'channels.manage', label: '管理渠道' },
  { key: 'announcements', label: '管理公告' },
  { key: 'settings.view', label: '查看设置' },
  { key: 'settings.edit', label: '编辑设置' },
  { key: 'logs.view', label: '查看日志' },
];

export default function AdminRbac() {
  const [roles] = useState<Role[]>(defaultRoles);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({
    '100': permissions.map(p => p.key),
    '10': permissions.map(p => p.key),
    '1': ['announcements', 'dashboard', 'users.view', 'orders.view'],
    '2': ['orders.view', 'orders.refund', 'payment.configure', 'dashboard'],
    '3': ['users.view', 'dashboard'],
    '4': ['users.view', 'dashboard', 'logs.view'],
  });

  const togglePerm = (roleId: number, perm: string) => {
    const current = rolePerms[String(roleId)] || [];
    const updated = current.includes(perm)
      ? current.filter(p => p !== perm)
      : [...current, perm];
    setRolePerms({ ...rolePerms, [String(roleId)]: updated });
    toast.success('权限已更新');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-5 w-5 sm:h-6 sm:w-6" /> 权限管理 RBAC
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => (
          <Card key={role.id} className={selectedRole === role.id ? 'ring-2 ring-primary' : 'cursor-pointer'}
            onClick={() => setSelectedRole(role.id)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{role.name}</CardTitle>
                <Badge variant={role.id >= 100 ? 'destructive' : role.id >= 10 ? 'default' : 'secondary'}>
                  {role.userCount} 人
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              权限配置 - {roles.find(r => r.id === selectedRole)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {permissions.map(p => {
                const has = (rolePerms[String(selectedRole)] || []).includes(p.key);
                return (
                  <button key={p.key} onClick={() => togglePerm(selectedRole, p.key)}
                    className={`p-2.5 rounded-lg border text-sm text-left transition-all ${
                      has ? 'border-primary bg-primary/5 text-primary' : 'hover:border-muted-foreground/30'
                    }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                        has ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'
                      }`}>{has ? '✓' : ''}</div>
                      <span>{p.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" size="sm">取消</Button>
              <Button size="sm"><Save className="h-4 w-4 mr-1" /> 保存权限</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
