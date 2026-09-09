import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const SECTIONS = [
  { path: '/admin/administration/logs', label: 'Logs', icon: 'journal-text' },
  { path: '/admin/administration/backup', label: 'Sauvegardes', icon: 'cloud-download' },
  { path: '/admin/administration/permissions', label: 'Permissions', icon: 'key' },
  { path: '/admin/administration/audit', label: 'Audit', icon: 'clipboard-data' },
];

/** Navigation entre les 4 pages Administration (superadmin). */
const AdminSectionNav: React.FC = () => (
  <Nav variant="pills" className="mb-4 flex-wrap gap-1">
    {SECTIONS.map(({ path, label, icon }) => (
      <Nav.Item key={path}>
        <NavLink to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <i className={`bi bi-${icon} me-1`} />
          {label}
        </NavLink>
      </Nav.Item>
    ))}
  </Nav>
);

export default AdminSectionNav;
