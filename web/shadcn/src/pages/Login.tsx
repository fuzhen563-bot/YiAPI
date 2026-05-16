import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@/hooks/use-auth';
import { useStatus } from '@/hooks/use-status';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { LogIn, User as UserIcon, Lock } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useUser();
  const { status } = useStatus();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('登录成功');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4 sm:p-6">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center pt-6 sm:pt-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <LogIn className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{status?.system_name || 'YiAPI'}</CardTitle>
          <CardDescription>登录管理后台</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">用户名</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名" className="pl-9" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码" className="pl-9" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
            {status?.password_register && (
              <p className="text-center text-sm text-muted-foreground">
                还没有账号？<Link to="/register" className="text-primary hover:underline font-medium">注册</Link>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
