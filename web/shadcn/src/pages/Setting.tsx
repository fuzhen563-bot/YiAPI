import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Settings, Save } from 'lucide-react';
import { useUser } from '@/hooks/use-auth';

interface Option {
  key: string; value: string; type?: string;
}

export default function Setting() {
  const { user, logout } = useUser();
  const [options, setOptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/option/').then((res) => {
      if (res.data.success) {
        const map: Record<string, string> = {};
        (res.data.data || []).forEach((o: Option) => { map[o.key] = o.value });
        setOptions(map);
      }
    }).catch(() => toast.error('加载设置失败'))
    .finally(() => setLoading(false));
  }, []);

  const updateOption = async (key: string, value: string) => {
    try {
      await api.put('/option/', { key, value });
      toast.success('已更新');
      setOptions((prev) => ({ ...prev, [key]: value }));
    } catch { toast.error('更新失败') }
  };

  const settings: { label: string; key: string; type?: string; tips?: string }[] = [
    { label: '系统名称', key: 'SystemName', tips: '显示在页面标题' },
    { label: 'Logo URL', key: 'Logo' },
    { label: '页脚 HTML', key: 'Footer' },
    { label: '每单位额度', key: 'QuotaPerUnit', type: 'number', tips: '1 元对应的额度数' },
    { label: '服务器地址', key: 'ServerAddress', tips: '用于支付回调' },
  ];

  const settingCards = [
    {
      title: '基本设置',
      items: settings,
    },
    {
      title: '登录与注册',
      items: [
        { label: '允许密码登录', key: 'PasswordLoginEnabled', type: 'switch' },
        { label: '允许注册', key: 'RegisterEnabled', type: 'switch' },
        { label: '密码注册', key: 'PasswordRegisterEnabled', type: 'switch' },
        { label: '邮箱验证', key: 'EmailVerificationEnabled', type: 'switch' },
        { label: '邮件域名白名单', key: 'EmailDomainWhitelist' },
      ],
    },
  ];

  if (user?.role !== 1) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Settings className="h-6 w-6" /> 设置</h1>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">仅管理员可访问系统设置</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Settings className="h-6 w-6" /> 系统设置</h1>
      </div>

      {settingCards.map((section) => (
        <Card key={section.title}>
          <CardHeader><CardTitle className="text-base">{section.title}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {section.items.map((item) => (
              <div key={item.key} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">{item.label}</label>
                  {item.tips && <p className="text-xs text-muted-foreground">{item.tips}</p>}
                </div>
                {item.type === 'switch' ? (
                  <Badge
                    variant={options[item.key] === 'true' ? 'success' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => updateOption(item.key, options[item.key] === 'true' ? 'false' : 'true')}
                  >
                    {options[item.key] === 'true' ? '开启' : '关闭'}
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2 w-[400px]">
                    <Input
                      value={options[item.key] || ''}
                      onChange={(e) => setOptions((p) => ({ ...p, [item.key]: e.target.value }))}
                    />
                    <Button variant="outline" size="sm" onClick={() => updateOption(item.key, options[item.key] || '')}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
