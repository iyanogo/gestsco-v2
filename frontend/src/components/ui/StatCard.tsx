import React from 'react';
import { Card } from 'react-bootstrap';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'admin' | 'teacher' | 'student';
  change?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  footer?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  variant = 'primary',
  change,
  footer
}) => {
  return (
    <Card className={`stat-card stat-${variant} border-0`}>
      <Card.Body className="d-flex align-items-center gap-3">
        <div className="stat-icon">
          <i className={`bi bi-${icon}`}></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{value}</div>
          <div className="stat-label">{title}</div>
        </div>
      </Card.Body>
      {(change || footer) && (
        <div className="stat-footer">
          {change && (
            <div className={`stat-change ${change.positive ? 'positive' : 'negative'}`}>
              <i className={`bi bi-arrow-${change.positive ? 'up' : 'down'}`}></i>
              <span>{Math.abs(change.value)}%</span>
              {change.label && <span className="ms-1">{change.label}</span>}
            </div>
          )}
          {footer}
        </div>
      )}
    </Card>
  );
};

export default StatCard;
