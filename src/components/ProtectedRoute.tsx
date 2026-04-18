// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: Props) => {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // এখনো admin role চেক করছি না (পরে যোগ করব)
  return <>{children}</>;
};
