import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RouteGuard = ({ children, allowedRoles }: RouteGuardProps) => {
  const { user, role, allRoles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const hasAccess = allowedRoles.some(r => allRoles.includes(r));
  if (!hasAccess) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default RouteGuard;
