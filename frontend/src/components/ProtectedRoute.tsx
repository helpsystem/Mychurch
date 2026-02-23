import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import Spinner from './Spinner';

interface ProtectedRouteProps {
  children: JSX.Element;
  roles?: UserRole[];
  permission?: string;  // optional: check for specific permission instead of role
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles, permission }) => {
  const { isAuthenticated, user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="12" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission-based check (if specified)
  if (permission && user && !hasPermission(permission)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Role-based check: user passes if ANY of their roles matches
  if (roles && user) {
    const userRoles = user.roles && Array.isArray(user.roles) ? user.roles : [user.role];
    const hasMatchingRole = userRoles.some(r => roles.includes(r));
    if (!hasMatchingRole) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
