import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { MenuItem } from './Sidebar';
import Header from './Header';
import type { HeaderNotification } from '../../types/notification';

export interface MainLayoutProps {
  menuItems: MenuItem[];
  userRole?: 'admin' | 'teacher' | 'student' | 'scolarite' | 'comptable';
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  notificationItems?: HeaderNotification[];
  notificationsLoading?: boolean;
  notificationsViewAllHref?: string | null;
  onLogout?: () => void;
  footerLabel?: string;
  profilePath?: string;
  settingsPath?: string | null;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  menuItems,
  userRole = 'admin',
  user,
  notificationItems = [],
  notificationsLoading = false,
  notificationsViewAllHref = null,
  onLogout,
  footerLabel,
  profilePath,
  settingsPath,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const layoutClass = `layout-${userRole}`;

  return (
    <div className={layoutClass}>
      <Sidebar
        menuItems={menuItems}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        userRole={userRole}
        footerLabel={footerLabel}
      />

      {sidebarOpen && (
        <div
          className="sidebar-overlay show"
          onClick={closeSidebar}
        />
      )}

      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          user={user}
          notificationItems={notificationItems}
          notificationsLoading={notificationsLoading}
          notificationsViewAllHref={notificationsViewAllHref}
          onToggleSidebar={toggleSidebar}
          onLogout={onLogout}
          profilePath={profilePath}
          settingsPath={settingsPath}
        />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
