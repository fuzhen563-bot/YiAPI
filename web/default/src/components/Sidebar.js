import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/User';
import { ThemeContext } from '../context/Theme';
import { useTranslation } from 'react-i18next';

import {
  Dropdown,
  Icon,
} from 'semantic-ui-react';
import {
  API,
  getLogo,
  getSystemName,
  isAdmin,
  showSuccess,
} from '../helpers';
import { renderQuota } from '../helpers/render';

const navItems = [
  { name: 'header.home', to: '/', icon: 'home', admin: false },
  { name: 'header.dashboard', to: '/dashboard', icon: 'chart bar', admin: false },
  { name: 'header.models', to: '/models', icon: 'grid layout', admin: false },
  { name: 'header.channel', to: '/channel', icon: 'sitemap', admin: true },
  { name: 'header.token', to: '/token', icon: 'key', admin: false },
  { name: 'header.redemption', to: '/redemption', icon: 'dollar sign', admin: true },
  { name: 'header.plan', to: '/plan', icon: 'rocket', admin: false },
  { name: 'header.plan_manage', to: '/plan/manage', icon: 'settings', admin: true },
  { name: 'header.topup', to: '/topup', icon: 'cart', admin: false },
  { name: 'header.user', to: '/user', icon: 'user', admin: true },
  { name: 'header.log', to: '/log', icon: 'book', admin: false },
  { name: 'header.setting', to: '/setting', icon: 'setting', admin: false },
  { name: 'header.about', to: '/about', icon: 'info circle', admin: false },
];

if (localStorage.getItem('chat_link')) {
  navItems.splice(2, 0, {
    name: 'header.chat', to: '/chat', icon: 'comments', admin: false,
  });
}

const Sidebar = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [userState, userDispatch] = useContext(UserContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const systemName = getSystemName();
  const logo = getLogo();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('');

  const isMobile = () => window.innerWidth <= 768;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const active = navItems.find((item) => location.pathname.startsWith(item.to));
    if (active) setPageTitle(t(active.name));
    else if (location.pathname === '/') setPageTitle(t('header.home'));
    else setPageTitle('');
    if (isMobile()) setMobileOpen(false);
  }, [location.pathname, t]);

  const logout = async () => {
    await API.get('/api/user/logout');
    showSuccess(t('messages.success.logout') || 'Logout successful!');
    userDispatch({ type: 'logout' });
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const languageOptions = [
    { key: 'zh', text: '中文', value: 'zh' },
    { key: 'en', text: 'English', value: 'en' },
  ];

  const sidebarContent = (
    <>
      <div className='sidebar-logo' onClick={() => navigate('/')}>
        <img src={logo} alt='logo' />
        {!collapsed && <span className='sidebar-title'>{systemName}</span>}
      </div>

      <div className='sidebar-nav'>
        {navItems.map((item) => {
          if (item.admin && !isAdmin()) return null;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-nav-item ${isActive(item.to) ? 'active' : ''}`}
            >
              <Icon name={item.icon} />
              {!collapsed && <span>{t(item.name)}</span>}
            </Link>
          );
        })}
      </div>

      <div className='sidebar-bottom'>
        <Dropdown
          trigger={
            <div className='sidebar-nav-item'>
              <Icon name='language' />
              {!collapsed && <span>{i18n.language === 'zh' ? '中文' : 'English'}</span>}
            </div>
          }
          options={languageOptions}
          value={i18n.language}
          onChange={(_, { value }) => i18n.changeLanguage(value)}
          className='sidebar-lang-dropdown'
        />

        <div className='sidebar-nav-item' onClick={toggleTheme} style={{ cursor: 'pointer' }}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          {!collapsed && <span>{theme === 'dark' ? t('header.light_mode') : t('header.dark_mode')}</span>}
        </div>

        {userState.user ? (
          <div className='sidebar-user'>
            <div className='sidebar-nav-item' onClick={logout} style={{ cursor: 'pointer' }}>
              <Icon name='sign-out' />
              {!collapsed && <span>{t('header.logout')}</span>}
            </div>
          </div>
        ) : (
          <div className='sidebar-nav-item' onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
            <Icon name='user' />
            {!collapsed && <span>{t('header.login')}</span>}
          </div>
        )}

        <div className='sidebar-nav-item collapse-btn' onClick={() => setCollapsed(!collapsed)}>
          <Icon name={collapsed ? 'chevron right' : 'chevron left'} />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <div className={`yiapi-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {sidebarContent}
      </div>

      {/* Main area */}
      <div className='yiapi-main'>
        {/* Top bar */}
        <div className='yiapi-topbar'>
          <div className='yiapi-topbar-left'>
            <div className='mobile-menu-btn' onClick={() => setMobileOpen(true)}>
              <Icon name='sidebar' />
            </div>
            {pageTitle && <span>{pageTitle}</span>}
          </div>
          <div className='yiapi-topbar-right'>
            {userState.user && (
              <>
                <span>{userState.user.username}</span>
                <span className='quota-badge'>
                  {renderQuota(userState.user.quota, t)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className='yiapi-content'>
          {children}
        </div>
      </div>
    </>
  );
};

export default Sidebar;