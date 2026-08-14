import React from 'react';
import { Button } from 'react-bootstrap';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="empty-state">
      <i className={`bi bi-${icon} empty-icon`}></i>
      <h5 className="empty-title">{title}</h5>
      {description && <p className="empty-description">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
