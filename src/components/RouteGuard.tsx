import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { AppUser } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShieldAlert, MailWarning } from 'lucide-react';

type AppRole = AppUser['role'];

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  // Email not confirmed
  if (!user.emailConfirmed) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-4 p-8">
          <MailWarning className="h-12 w-12 text-warning mx-auto" />
          <h1 className="text-xl font-bold">Verify Your Email</h1>
          <p className="text-muted-foreground">
            We sent a verification link to <strong>{user.email}</strong>. Please check your inbox and verify your email address to access the platform.
          </p>
          <Button variant="outline" onClick={logout}>Sign Out</Button>
        </div>
      </div>
    );
  }

  // Suspended
  if (user.suspended) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-4 p-8">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended. If you believe this is an error, please contact support.
          </p>
          <Button variant="outline" onClick={logout}>Sign Out</Button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user && user.emailConfirmed && !user.suspended) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
