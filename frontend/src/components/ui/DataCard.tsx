import React from 'react';
import { Card } from 'react-bootstrap';

export interface DataCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  loading?: boolean;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  children,
  actions,
  footer,
  className = '',
  bodyClassName = '',
  loading = false
}) => {
  return (
    <Card className={`data-card ${className}`}>
      <Card.Header>
        <h5 className="card-title">{title}</h5>
        {actions && <div className="card-actions">{actions}</div>}
      </Card.Header>
      <Card.Body className={bodyClassName}>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : (
          children
        )}
      </Card.Body>
      {footer && <Card.Footer>{footer}</Card.Footer>}
    </Card>
  );
};

export default DataCard;
