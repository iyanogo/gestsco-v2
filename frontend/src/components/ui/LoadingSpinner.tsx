import React from 'react';
import { Spinner } from 'react-bootstrap';

export interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Chargement...',
  fullScreen = false,
  size = 'md'
}) => {
  const spinnerSize = size === 'sm' ? 'sm' : undefined;
  const spinnerStyle = size === 'lg' ? { width: '3rem', height: '3rem' } : undefined;

  const content = (
    <div className="loading-spinner">
      <Spinner
        animation="border"
        variant="primary"
        size={spinnerSize}
        style={spinnerStyle}
      />
      {message && <span className="text-muted">{message}</span>}
    </div>
  );

  if (fullScreen) {
    return <div className="loading-overlay">{content}</div>;
  }

  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      {content}
    </div>
  );
};

export default LoadingSpinner;
