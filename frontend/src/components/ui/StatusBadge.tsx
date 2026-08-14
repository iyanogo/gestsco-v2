import React from 'react';
import { Badge } from 'react-bootstrap';

export interface StatusBadgeProps {
  status: 'active' | 'pending' | 'inactive' | 'success' | 'warning' | 'danger';
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfig = {
  active: { bg: 'success', label: 'Actif' },
  pending: { bg: 'warning', label: 'En attente' },
  inactive: { bg: 'secondary', label: 'Inactif' },
  success: { bg: 'success', label: 'Succès' },
  warning: { bg: 'warning', label: 'Attention' },
  danger: { bg: 'danger', label: 'Erreur' }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md'
}) => {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <Badge
      bg={config.bg}
      className={`badge-status status-${status} ${size === 'sm' ? 'badge-sm' : ''}`}
      pill
    >
      {displayLabel}
    </Badge>
  );
};

export default StatusBadge;
