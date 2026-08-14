import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { MenuItem } from './Sidebar';
import Header from './Header';

export interface MainLayoutProps {
  menuItems: MenuItem[];
  userRole?: 'admin' | 'teacher' | 'student';
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  notifications?: number;
  onLogout?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  menuItems,
  userRole = 'admin',
  user,
  notifications = 0,
  onLogout
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
          notifications={notifications}
          onToggleSidebar={toggleSidebar}
          onLogout={onLogout}
        />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
