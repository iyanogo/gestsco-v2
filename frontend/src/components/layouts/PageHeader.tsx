import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions
}) => {
  return (
    <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="page-breadcrumb mt-2">
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
              <i className="bi bi-house-door"></i>
            </Breadcrumb.Item>
            {breadcrumbs.map((item, index) => (
              <Breadcrumb.Item
                key={index}
                active={index === breadcrumbs.length - 1}
                linkAs={item.path ? Link : undefined}
                linkProps={item.path ? { to: item.path } : undefined}
              >
                {item.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        )}
      </div>
      {actions && (
        <div className="page-actions d-flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
