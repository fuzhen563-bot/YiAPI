import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Cuboid, Cable, Key, ScrollText, Coins,
  Package, Ticket, Users, Settings, MessageSquare, Menu, X,
  Sun, Moon, LogOut, Info, Gift, User, Shield, ChevronDown, ChevronUp,
  Zap, Award, Ban, CreditCard, Cpu, Activity, TrendingUp, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const userNav: NavItem[] = [
  { label: '概览 Dashboard', path: '/overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: '模型广场 Models', path: '/models', icon: <Cuboid className="h-4 w-4" /> },
  { label: '套餐订阅 TokenPlan', path: '/plans', icon: <Package className="h-4 w-4" /> },
  { label: '资源包 Add-on', path: '/addon', icon: <Package className="h-4 w-4" /> },
  { label: 'API 密钥', path: '/api-keys', icon: <Key className="h-4 w-4" /> },
  { label: '充值中心 Billing', path: '/topup', icon: <Coins className="h-4 w-4" /> },
  { label: '用量统计 Usage', path: '/usage', icon: <ScrollText className="h-4 w-4" /> },
  { label: '邀请中心 Affiliate', path: '/invite', icon: <Gift className="h-4 w-4" /> },
  { label: '账号与套餐 Account', path: '/account', icon: <User className="h-4 w-4" /> },
  { label: '公告与问答 Help', path: '/help', icon: <Info className="h-4 w-4" /> },
];

interface NavSection {
  label: string;
  items: NavItem[];
}

const adminSections: NavSection[] = [
  {
    label: '仪表盘',
    items: [
      { label: '经营总览', path: '/admin/overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    label: '用户管理',
    items: [
      { label: '用户列表', path: '/admin/users', icon: <Users className="h-4 w-4" /> },
      { label: '用户等级', path: '/admin/user-tiers', icon: <Award className="h-4 w-4" /> },
      { label: '黑名单', path: '/admin/blacklist', icon: <Ban className="h-4 w-4" /> },
    ],
  },
  {
    label: '套餐与资源',
    items: [
      { label: 'TokenPlan', path: '/admin/plans', icon: <Package className="h-4 w-4" /> },
      { label: '资源包 SKU', path: '/admin/sku', icon: <Zap className="h-4 w-4" /> },
    ],
  },
  {
    label: '财务中心',
    items: [
      { label: '订单管理', path: '/admin/orders', icon: <ScrollText className="h-4 w-4" /> },
      { label: '支付配置', path: '/admin/payment', icon: <CreditCard className="h-4 w-4" /> },
    ],
  },
  {
    label: '模型网关',
    items: [
      { label: '模型列表', path: '/admin/models', icon: <Cpu className="h-4 w-4" /> },
      { label: '模型倍率', path: '/admin/model-rates', icon: <Settings className="h-4 w-4" /> },
    ],
  },
  {
    label: '上游供应商',
    items: [
      { label: 'Provider 列表', path: '/channel', icon: <Cable className="h-4 w-4" /> },
      { label: '渠道健康', path: '/admin/channel-health', icon: <Activity className="h-4 w-4" /> },
    ],
  },
  {
    label: '增长中心',
    items: [
      { label: '邀请系统', path: '/admin/affiliates', icon: <Gift className="h-4 w-4" /> },
      { label: '成长等级', path: '/admin/levels', icon: <TrendingUp className="h-4 w-4" /> },
    ],
  },
  {
    label: '营销中心',
    items: [
      { label: '公告', path: '/admin/announcements', icon: <Bell className="h-4 w-4" /> },
    ],
  },
  {
    label: 'API 密钥',
    items: [
      { label: 'Key 管理', path: '/token', icon: <Key className="h-4 w-4" /> },
      { label: 'IP 白名单', path: '/admin/ip-whitelist', icon: <Shield className="h-4 w-4" /> },
    ],
  },
  {
    label: '审计日志',
    items: [
      { label: '操作日志', path: '/log', icon: <ScrollText className="h-4 w-4" /> },
    ],
  },
  {
    label: '系统设置',
    items: [
      { label: '站点设置', path: '/setting', icon: <Settings className="h-4 w-4" /> },
    ],
  },
];

export function Sidebar({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const location = useLocation();
  const { user, logout } = useUser();
  const { theme, toggle } = useTheme();
  const isAdmin = user?.role === 1;

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname]);

  // Auto-switch to admin when visiting admin routes
  const adminPaths = ['/admin','/dashboard','/channel','/token','/log','/token-plan','/redemption','/user','/setting'];
  useEffect(() => {
    if (adminPaths.some(p => location.pathname.startsWith(p))) {
      setMode('admin');
    }
  }, [location.pathname]);

  const isLoginPage = location.pathname === '/login' || location.pathname === '/register';
  if (isLoginPage) return <>{children}</>;

  const title = mode === 'user' ? '用户中心' : '管理面板';
  const icon = mode === 'user' ? <LayoutDashboard className="h-4 w-4" /> : <Shield className="h-4 w-4" />;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 z-50 h-full flex-col border-r bg-sidebar transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex h-14 items-center border-b shrink-0',
          collapsed ? 'justify-center px-2' : 'gap-2 px-4'
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shrink-0">Y</div>
          {!collapsed && <span className="font-semibold truncate">YiAPI</span>}
        </div>

        {/* Section Header */}
        {!collapsed && (
          <div className="px-3 py-2 mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {icon}
            {title}
          </div>
        )}

        {/* Nav - User mode */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {mode === 'user' ? (
            userNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))
          ) : (
            /* Admin mode - sections */
            <div className="space-y-4">
              {adminSections.map((section) => (
                <div key={section.label}>
                  {!collapsed && (
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {section.label}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors',
                            collapsed && 'justify-center px-2',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                          )
                        }
                        title={collapsed ? item.label : undefined}
                      >
                        {item.icon}
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Mode Switch + User */}
        <div className="border-t shrink-0 p-3">
          {isAdmin && (
            <button
              onClick={() => setMode(mode === 'user' ? 'admin' : 'user')}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors mb-2',
                collapsed ? 'justify-center' : '',
                mode === 'admin'
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
              title={collapsed ? (mode === 'user' ? '管理面板' : '用户中心') : undefined}
            >
              {mode === 'user' ? <Shield className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
              {!collapsed && (mode === 'user' ? '切换到管理面板' : '切换到用户中心')}
            </button>
          )}
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username || '未登录'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role === 1 ? '管理员' : '用户'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-sidebar transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shrink-0">Y</div>
          <span className="font-semibold truncate">YiAPI</span>
        </div>

        {/* Section Header */}
        <div className="px-3 py-2 mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {icon}
          {title}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {mode === 'user' ? (
            userNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )
                }
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))
          ) : (
            <div className="space-y-3">
              {adminSections.map((section) => (
                <div key={section.label}>
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {section.label}
                  </div>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )
                      }
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Mobile - Mode Switch */}
        <div className="border-t p-3 shrink-0">
          {isAdmin && (
            <button
              onClick={() => setMode(mode === 'user' ? 'admin' : 'user')}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors mb-2',
                mode === 'admin'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {mode === 'user' ? <Shield className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
              {mode === 'user' ? '切换到管理面板' : '切换到用户中心'}
            </button>
          )}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username || '未登录'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role === 1 ? '管理员' : '用户'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={cn('flex-1 flex flex-col min-w-0', 'lg:ml-64', collapsed && 'lg:ml-16')}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 lg:px-6 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex">
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>

          <div className="flex-1" />

          <Button variant="ghost" size="icon" onClick={toggle} title={theme === 'light' ? '暗色模式' : '亮色模式'}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={logout} title="退出登录">
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
