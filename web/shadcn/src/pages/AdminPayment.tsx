import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { CreditCard, Save, Power, PowerOff } from 'lucide-react';

interface Option {
  key: string; value: string;
}

export default function AdminPayment() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/option/').then((res) => {
      if (res.data.success) {
        const map: Record<string, string> = {};
        (res.data.data || []).forEach((o: Option) => { map[o.key] = o.value });
        setOptions(map);
      }
    }).finally(() => setLoading(false));
  }, []);

  const update = async (key: string, value: string) => {
    setSaving(true);
    try {
      await api.put('/option/', { key, value });
      setOptions(p => ({ ...p, [key]: value }));
      toast.success('已更新');
    } catch { toast.error('更新失败') }
    finally { setSaving(false) }
  };

  const toggle = (key: string) => update(key, options[key] === 'true' ? 'false' : 'true');

  const configs = [
    { label: '启用在线支付', key: 'PaymentEnabled', type: 'toggle' },
    { label: '支付接口地址', key: 'YiPayApiUrl', placeholder: 'https://your-epay.com' },
    { label: '商户 ID', key: 'YiPayPid', placeholder: '1000' },
    { label: '商户密钥', key: 'YiPayKey', placeholder: 'your_md5_key', type: 'password' },
    { label: '支付通知地址', key: 'YiPayNotifyUrl', placeholder: 'https://your-domain.com/api/payment/notify/yipay' },
    { label: '支付返回地址', key: 'YiPayReturnUrl', placeholder: 'https://your-domain.com/' },
    { label: '启用直充接口', key: 'DirectTopupEnabled', type: 'toggle' },
    { label: '直充密钥', key: 'DirectTopupKey', placeholder: 'your_secret_key', type: 'password' },
  ];

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" /> 支付配置
        </h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">支付渠道设置</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {configs.map((cfg) => (
            <div key={cfg.key}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">{cfg.label}</label>
                </div>
                {cfg.type === 'toggle' ? (
                  <Button variant="outline" size="sm" onClick={() => toggle(cfg.key)} className="min-w-[80px]">
                    {options[cfg.key] === 'true' ? <><Power className="h-4 w-4 mr-1 text-green-500" /> 开启</> : <><PowerOff className="h-4 w-4 mr-1" /> 关闭</>}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 w-[400px]">
                    <Input type={cfg.type === 'password' ? 'password' : 'text'}
                      value={options[cfg.key] || ''}
                      onChange={(e) => setOptions(p => ({ ...p, [cfg.key]: e.target.value }))}
                      placeholder={cfg.placeholder} />
                    <Button variant="outline" size="sm" onClick={() => update(cfg.key, options[cfg.key] || '')}
                      disabled={saving}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Separator className="mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
