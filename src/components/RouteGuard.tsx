import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { AppUser } from '@/contexts/AuthContext';

type AppRole = AppUser['role'];

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
