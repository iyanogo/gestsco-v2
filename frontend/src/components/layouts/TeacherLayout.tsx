import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { teacherMenuItems } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';

const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MainLayout
      menuItems={teacherMenuItems}
      userRole="teacher"
      user={{
        name: user?.full_name || user?.email || 'Enseignant',
        role: 'Enseignant',
        avatar: undefined
      }}
      notifications={2}
      onLogout={handleLogout}
    />
  );
};

export default TeacherLayout;
