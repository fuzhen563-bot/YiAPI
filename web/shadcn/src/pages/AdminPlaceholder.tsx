import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Construction } from 'lucide-react';

const pageNames: Record<string, string> = {
  '/admin/overview': '经营总览',
  '/admin/users': '用户列表',
  '/admin/user-tiers': '用户等级',
  '/admin/blacklist': '黑名单',
  '/admin/plans': 'TokenPlan 管理',
  '/admin/sku': '资源包 SKU 管理',
  '/admin/orders': '订单管理',
  '/admin/payment': '支付配置',
  '/admin/models': '模型列表',
  '/admin/model-rates': '模型倍率',
  '/admin/channel-health': '渠道健康',
  '/admin/affiliates': '邀请系统',
  '/admin/levels': '成长等级',
  '/admin/announcements': '公告管理',
  '/admin/ip-whitelist': 'IP 白名单',
  '/admin/enterprise': '企业客户',
  '/admin/rbac': '权限管理',
};

export default function AdminPlaceholder() {
  const location = useLocation();
  const name = pageNames[location.pathname] || '管理中台';

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{name}</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
          <Construction className="h-12 w-12" />
          <p className="text-lg font-medium">{name}</p>
          <p className="text-sm">功能开发中，敬请期待</p>
        </CardContent>
      </Card>
    </div>
  );
}
