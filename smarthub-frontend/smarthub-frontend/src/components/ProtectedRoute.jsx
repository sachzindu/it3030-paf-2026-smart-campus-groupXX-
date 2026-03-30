import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard that checks authentication and role authorization.
 *
 * Props:
 *   - children: the component to render if authorized
 *   - allowedRoles: array of role strings that can access this route (e.g., ['ADMIN'])
 *
 * Behavior:
 *   - Shows loading spinner while auth is being checked
 *   - Redirects to /login if not authenticated
 *   - Redirects to the user's own dashboard if authenticated but wrong role
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading, getDashboardPath } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to the user's own dashboard if they don't have the right role
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return children;
}
