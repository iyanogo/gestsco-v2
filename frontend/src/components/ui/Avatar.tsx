import React from 'react';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = ''
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClass = size !== 'md' ? `avatar-${size}` : '';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`avatar ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div className={`avatar ${sizeClass} ${className}`}>
      {name ? getInitials(name) : 'U'}
    </div>
  );
};

export default Avatar;
