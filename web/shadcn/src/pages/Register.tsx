import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStatus } from '@/hooks/use-status';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { UserPlus, UserIcon, Lock, Mail } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { status } = useStatus();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/user/register', {
        username, password, email: email || undefined,
      });
      if (res.data.success) {
        toast.success('注册成功，请登录');
        navigate('/login');
      } else {
        toast.error(res.data.message || '注册失败');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  if (!status?.password_register) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">注册已关闭</p>
            <Button className="mt-4" onClick={() => navigate('/login')}>返回登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <UserPlus className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>注册账号</CardTitle>
          <CardDescription>创建新账号以使用服务</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">用户名</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-9" required />
              </div>
            </div>
            {status?.email_verification && (
              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              已有账号？<Link to="/login" className="text-primary hover:underline">登录</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
