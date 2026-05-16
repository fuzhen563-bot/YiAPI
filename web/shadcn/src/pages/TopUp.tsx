import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/use-auth';
import { useStatus } from '@/hooks/use-status';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Coins, TicketCheck, CreditCard } from 'lucide-react';
import { renderQuota } from '@/lib/utils';

export default function TopUp() {
  const { user, refreshUser } = useUser();
  const { status } = useStatus();
  const [redeemCode, setRedeemCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/user/topup', { key: redeemCode.trim() });
      if (res.data.success) {
        toast.success(`充值成功！+${(res.data.data / 1000000).toFixed(2)}`);
        setRedeemCode('');
        refreshUser();
      } else {
        toast.error(res.data.message || '充值失败');
      }
    } catch { toast.error('充值失败') }
    finally { setLoading(false) }
  };

  const handlePayment = async () => {
    try {
      const res = await api.post('/payment/create', { amount: 1 });
      if (res.data.success) {
        window.open(res.data.data.url, '_blank');
      } else {
        toast.error(res.data.message || '创建支付失败');
      }
    } catch { toast.error('支付服务不可用') }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Coins className="h-6 w-6" /> 充值中心</h1>
        <p className="text-sm text-muted-foreground">充值额度或使用兑换码</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TicketCheck className="h-5 w-5" /> 兑换码充值</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="请输入兑换码" onKeyDown={(e) => e.key === 'Enter' && handleRedeem()} />
              <Button onClick={handleRedeem} disabled={loading}>{loading ? '处理中' : '兑换'}</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              当前余额：<span className="font-bold text-foreground">{renderQuota(user?.quota || 0, status?.display_in_currency)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> 在线支付</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">通过在线支付方式充值</p>
            <Button onClick={handlePayment} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" /> 充值
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
