import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from '@/hooks/use-theme';
import { StatusProvider } from '@/hooks/use-status';
import { UserProvider } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

// Critical path - eagerly loaded
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import UserOverview from '@/pages/UserOverview';
import Models from '@/pages/Models';
import Plans from '@/pages/Plans';
import WalletPage from '@/pages/WalletPage';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminBlacklist from '@/pages/AdminBlacklist';
import AdminOrders from '@/pages/AdminOrders';
import AdminPayment from '@/pages/AdminPayment';
import AdminModels from '@/pages/AdminModels';
import AdminModelRates from '@/pages/AdminModelRates';
import AdminChannelHealth from '@/pages/AdminChannelHealth';
import AdminAffiliates from '@/pages/AdminAffiliates';
import AdminSku from '@/pages/AdminSku';
import AdminAnnouncements from '@/pages/AdminAnnouncements';
import AdminUserTiers from '@/pages/AdminUserTiers';
import AdminIpWhitelist from '@/pages/AdminIpWhitelist';
import AdminLevels from '@/pages/AdminLevels';
import AdminEnterprise from '@/pages/AdminEnterprise';
import AdminRbac from '@/pages/AdminRbac';

// Lazy loaded admin pages
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
const AdminUsers = React.lazy(() => import('@/pages/AdminUsers'));
const AdminSku = React.lazy(() => import('@/pages/AdminSku'));
const AdminOrders = React.lazy(() => import('@/pages/AdminOrders'));
const AdminPayment = React.lazy(() => import('@/pages/AdminPayment'));
const AdminModels = React.lazy(() => import('@/pages/AdminModels'));
const AdminModelRates = React.lazy(() => import('@/pages/AdminModelRates'));
const AdminChannelHealth = React.lazy(() => import('@/pages/AdminChannelHealth'));
const AdminAffiliates = React.lazy(() => import('@/pages/AdminAffiliates'));
const AdminAnnouncements = React.lazy(() => import('@/pages/AdminAnnouncements'));
import AdminPlaceholder from '@/pages/AdminPlaceholder';

// Lazy loaded user pages
const TokenPage = React.lazy(() => import('@/pages/TokenPage'));
const Addon = React.lazy(() => import('@/pages/Addon'));
const Usage = React.lazy(() => import('@/pages/Usage'));
const Invite = React.lazy(() => import('@/pages/Invite'));
const Account = React.lazy(() => import('@/pages/Account'));
const Help = React.lazy(() => import('@/pages/Help'));
const Channel = React.lazy(() => import('@/pages/Channel'));
const Log = React.lazy(() => import('@/pages/Log'));
const TokenPlan = React.lazy(() => import('@/pages/TokenPlan'));
const Redemption = React.lazy(() => import('@/pages/Redemption'));
const UserPage = React.lazy(() => import('@/pages/UserPage'));
const Setting = React.lazy(() => import('@/pages/Setting'));
const Chat = React.lazy(() => import('@/pages/Chat'));
const About = React.lazy(() => import('@/pages/About'));

function LazyFallback() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>;
}

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <StatusProvider>
          <UserProvider>
            <Sidebar>
              <Routes>
                <Route path="/" element={<Navigate to="/overview" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/overview" element={<UserOverview />} />
                <Route path="/models" element={<Models />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/topup" element={<WalletPage />} />

                {/* User lazy routes */}
                <Route path="/addon" element={<SuspenseWrapper><Addon /></SuspenseWrapper>} />
                <Route path="/api-keys" element={<SuspenseWrapper><TokenPage /></SuspenseWrapper>} />
                <Route path="/usage" element={<SuspenseWrapper><Usage /></SuspenseWrapper>} />
                <Route path="/invite" element={<SuspenseWrapper><Invite /></SuspenseWrapper>} />
                <Route path="/account" element={<SuspenseWrapper><Account /></SuspenseWrapper>} />
                <Route path="/help" element={<SuspenseWrapper><Help /></SuspenseWrapper>} />

                {/* Admin routes */}
                <Route path="/dashboard" element={<SuspenseWrapper><AdminDashboard /></SuspenseWrapper>} />
                <Route path="/admin/overview" element={<SuspenseWrapper><AdminDashboard /></SuspenseWrapper>} />
                <Route path="/admin/users" element={<SuspenseWrapper><AdminUsers /></SuspenseWrapper>} />
                <Route path="/admin/user-tiers" element={<SuspenseWrapper><AdminUserTiers /></SuspenseWrapper>} />
                <Route path="/admin/blacklist" element={<SuspenseWrapper><AdminBlacklist /></SuspenseWrapper>} />
                <Route path="/admin/plans" element={<SuspenseWrapper><TokenPlan /></SuspenseWrapper>} />
                <Route path="/admin/sku" element={<SuspenseWrapper><AdminSku /></SuspenseWrapper>} />
                <Route path="/admin/orders" element={<SuspenseWrapper><AdminOrders /></SuspenseWrapper>} />
                <Route path="/admin/payment" element={<SuspenseWrapper><AdminPayment /></SuspenseWrapper>} />
                <Route path="/admin/models" element={<SuspenseWrapper><AdminModels /></SuspenseWrapper>} />
                <Route path="/admin/model-rates" element={<SuspenseWrapper><AdminModelRates /></SuspenseWrapper>} />
                <Route path="/admin/channel-health" element={<SuspenseWrapper><AdminChannelHealth /></SuspenseWrapper>} />
                <Route path="/admin/affiliates" element={<SuspenseWrapper><AdminAffiliates /></SuspenseWrapper>} />
                <Route path="/admin/levels" element={<SuspenseWrapper><AdminLevels /></SuspenseWrapper>} />
                <Route path="/admin/announcements" element={<SuspenseWrapper><AdminAnnouncements /></SuspenseWrapper>} />
                <Route path="/admin/ip-whitelist" element={<SuspenseWrapper><AdminIpWhitelist /></SuspenseWrapper>} />
                <Route path="/admin/enterprise" element={<SuspenseWrapper><AdminEnterprise /></SuspenseWrapper>} />
                <Route path="/admin/rbac" element={<SuspenseWrapper><AdminRbac /></SuspenseWrapper>} />

                {/* Legacy admin routes */}
                <Route path="/channel" element={<SuspenseWrapper><Channel /></SuspenseWrapper>} />
                <Route path="/token" element={<SuspenseWrapper><TokenPage /></SuspenseWrapper>} />
                <Route path="/log" element={<SuspenseWrapper><Log /></SuspenseWrapper>} />
                <Route path="/token-plan" element={<SuspenseWrapper><TokenPlan /></SuspenseWrapper>} />
                <Route path="/redemption" element={<SuspenseWrapper><Redemption /></SuspenseWrapper>} />
                <Route path="/user" element={<SuspenseWrapper><UserPage /></SuspenseWrapper>} />
                <Route path="/setting" element={<SuspenseWrapper><Setting /></SuspenseWrapper>} />
                <Route path="/chat" element={<SuspenseWrapper><Chat /></SuspenseWrapper>} />
                <Route path="/about" element={<SuspenseWrapper><About /></SuspenseWrapper>} />
              </Routes>
            </Sidebar>
            <ToastContainer position="top-center" />
          </UserProvider>
        </StatusProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
