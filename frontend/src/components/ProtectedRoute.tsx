import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface ProtectedRouteProps {
  children: ReactNode;
  role: 'ADMIN' | 'VENDEDOR' | 'PROJETISTA' | 'CLIENT';
}

const roleToPath: Record<string, string> = {
  ADMIN: '/admin',
  VENDEDOR: '/vendedor',
  PROJETISTA: '/projetista',
  CLIENT: '/client',
};

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={roleToPath[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
}
