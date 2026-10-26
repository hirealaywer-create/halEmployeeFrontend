import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <ShieldCheck className="loading-shield-icon" />
          <div className="spinner-wrapper">
            <RefreshCw className="loading-spinner" />
          </div>
          <span className="loading-text">Verifying Employee Credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
