import React from 'react';
import { Dropdown, Form, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import type { HeaderNotification } from '../../types/notification';

export interface HeaderProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  notificationItems?: HeaderNotification[];
  notificationsLoading?: boolean;
  notificationsViewAllHref?: string | null;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  showSearch?: boolean;
  profilePath?: string;
  settingsPath?: string | null;
}

const Header: React.FC<HeaderProps> = ({
  user,
  notificationItems = [],
  notificationsLoading = false,
  notificationsViewAllHref = null,
  onToggleSidebar,
  onLogout,
  showSearch = true,
  profilePath = '/profile',
  settingsPath = null,
}) => {
  const unreadCount = notificationItems.filter((item) => item.unread !== false).length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="main-header">
      <div className="header-content">
        <div className="header-left">
          <button
            className="btn btn-icon btn-light d-lg-none"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list"></i>
          </button>

          {showSearch && (
            <div className="header-search d-none d-md-block">
              <i className="bi bi-search search-icon"></i>
              <Form.Control
                type="search"
                placeholder="Rechercher..."
                aria-label="Rechercher"
              />
            </div>
          )}
        </div>

        <div className="header-right">
          <Dropdown align="end" className="header-notifications">
            <Dropdown.Toggle
              variant="light"
              className="btn-icon position-relative"
              id="notifications-dropdown"
              aria-label="Notifications"
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                <Badge
                  bg="danger"
                  pill
                  className="notification-badge"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="dropdown-menu-lg p-0 notifications-panel" style={{ width: '320px' }}>
              <div className="p-3 border-bottom">
                <h6 className="mb-0">Notifications</h6>
              </div>
              <div className="notifications-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notificationsLoading ? (
                  <div className="text-center py-4 text-muted">
                    <Spinner animation="border" size="sm" className="mb-2" />
                    <small className="d-block">Chargement…</small>
                  </div>
                ) : notificationItems.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-bell-slash fs-2 d-block mb-2"></i>
                    <small>Aucune notification</small>
                  </div>
                ) : (
                  <div className="p-2">
                    {notificationItems.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href}
                        className={`dropdown-item notification-item d-flex align-items-start ${
                          item.unread !== false ? 'unread' : ''
                        }`}
                      >
                        <div className={`notification-icon icon-${item.variant || 'info'}`}>
                          <i className={`bi ${
                            item.variant === 'danger'
                              ? 'bi-exclamation-circle'
                              : item.variant === 'warning'
                                ? 'bi-exclamation-triangle'
                                : item.variant === 'success'
                                  ? 'bi-check-circle'
                                  : 'bi-info-circle'
                          }`}></i>
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">{item.title}</div>
                          <div className="notification-text">{item.message}</div>
                        </div>
                        {item.unread !== false && <div className="notification-dot"></div>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {notificationsViewAllHref && notificationItems.length > 0 && (
                <div className="p-2 border-top text-center">
                  <Link to={notificationsViewAllHref} className="text-primary small">
                    Voir le détail
                  </Link>
                </div>
              )}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown align="end">
            <Dropdown.Toggle
              variant="link"
              className="header-user p-0 text-decoration-none"
              id="user-dropdown"
              data-testid="user-menu"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="user-avatar"
                />
              ) : (
                <div className="avatar">
                  {user ? getInitials(user.name) : 'U'}
                </div>
              )}
              <div className="user-info d-none d-sm-block">
                <div className="user-name">{user?.name || 'Utilisateur'}</div>
                <div className="user-role">{user?.role || 'Rôle'}</div>
              </div>
              <i className="bi bi-chevron-down ms-2 text-muted d-none d-sm-inline"></i>
            </Dropdown.Toggle>

            <Dropdown.Menu data-testid="user-dropdown">
              <Dropdown.Item as={Link} to={profilePath}>
                <i className="bi bi-person me-2"></i>
                Mon profil
              </Dropdown.Item>
              {settingsPath && (
                <Dropdown.Item as={Link} to={settingsPath}>
                  <i className="bi bi-gear me-2"></i>
                  Paramètres
                </Dropdown.Item>
              )}
              <Dropdown.Divider />
              <Dropdown.Item onClick={onLogout} className="text-danger">
                <i className="bi bi-box-arrow-right me-2"></i>
                Déconnexion
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Header;
