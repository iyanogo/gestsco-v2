import React, { useState } from 'react';
import { Nav, Collapse } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  badge?: string | number;
  children?: MenuItem[];
}

export interface SidebarProps {
  menuItems: MenuItem[];
  brandName?: string;
  brandIcon?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  userRole?: 'admin' | 'teacher' | 'student';
}

const Sidebar: React.FC<SidebarProps> = ({
  menuItems,
  brandName = 'GestSco',
  brandIcon = 'GS',
  collapsed = false,
  userRole = 'admin'
}) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isMenuOpen = (menuId: string) => openMenus.includes(menuId);

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path) || (hasChildren && item.children?.some(child => isActive(child.path)));

    if (hasChildren) {
      return (
        <Nav.Item key={item.id} className="nav-dropdown">
          <Nav.Link
            className={`nav-dropdown-toggle ${active ? 'active' : ''}`}
            onClick={() => toggleMenu(item.id)}
            aria-expanded={isMenuOpen(item.id)}
          >
            <i className={`bi bi-${item.icon} nav-icon`}></i>
            <span className="nav-link-text">{item.label}</span>
            {item.badge && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </Nav.Link>
          <Collapse in={isMenuOpen(item.id)}>
            <div className="nav-dropdown-menu">
              {item.children?.map(child => (
                <Nav.Item key={child.id}>
                  <Nav.Link
                    as={Link}
                    to={child.path || '#'}
                    className={isActive(child.path) ? 'active' : ''}
                  >
                    <i className={`bi bi-${child.icon} nav-icon`}></i>
                    <span className="nav-link-text">{child.label}</span>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </div>
          </Collapse>
        </Nav.Item>
      );
    }

    return (
      <Nav.Item key={item.id}>
        <Nav.Link
          as={Link}
          to={item.path || '#'}
          className={active ? 'active' : ''}
        >
          <i className={`bi bi-${item.icon} nav-icon`}></i>
          <span className="nav-link-text">{item.label}</span>
          {item.badge && (
            <span className="nav-badge">{item.badge}</span>
          )}
        </Nav.Link>
      </Nav.Item>
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          {brandIcon}
        </div>
        <span className="sidebar-brand-text">{brandName}</span>
      </div>

      <Nav className="sidebar-nav flex-column">
        {menuItems.map(item => renderMenuItem(item))}
      </Nav>

      <div className="sidebar-footer">
        <div className="d-flex align-items-center text-white-50">
          <i className="bi bi-shield-check me-2"></i>
          <small className="nav-link-text">
            {userRole === 'admin' && 'Administration'}
            {userRole === 'teacher' && 'Espace Enseignant'}
            {userRole === 'student' && 'Espace Étudiant'}
          </small>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
