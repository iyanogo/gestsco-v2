import React from 'react';
import { Dropdown, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export interface HeaderProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  notifications?: number;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  showSearch?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  user,
  notifications = 0,
  onToggleSidebar,
  onLogout,
  showSearch = true
}) => {
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
            >
              <i className="bi bi-bell"></i>
              {notifications > 0 && (
                <Badge
                  bg="danger"
                  pill
                  className="notification-badge"
                >
                  {notifications > 99 ? '99+' : notifications}
                </Badge>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="dropdown-menu-lg p-0" style={{ width: '320px' }}>
              <div className="p-3 border-bottom">
                <h6 className="mb-0">Notifications</h6>
              </div>
              <div className="notifications-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-bell-slash fs-2 d-block mb-2"></i>
                    <small>Aucune notification</small>
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="notification-item unread">
                      <div className="notification-icon icon-info">
                        <i className="bi bi-info-circle"></i>
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">Nouvelle inscription</div>
                        <div className="notification-text">Un nouvel étudiant s'est inscrit</div>
                        <div className="notification-time">Il y a 5 min</div>
                      </div>
                      <div className="notification-dot"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2 border-top text-center">
                <Link to="/notifications" className="text-primary small">
                  Voir toutes les notifications
                </Link>
              </div>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown align="end">
            <Dropdown.Toggle
              variant="link"
              className="header-user p-0 text-decoration-none"
              id="user-dropdown"
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

            <Dropdown.Menu>
              <Dropdown.Item as={Link} to="/profile">
                <i className="bi bi-person me-2"></i>
                Mon profil
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/settings">
                <i className="bi bi-gear me-2"></i>
                Paramètres
              </Dropdown.Item>
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
