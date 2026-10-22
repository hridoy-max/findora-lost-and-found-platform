
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guard component that restricts access to admin-only routes.
 * If the user is not signed in, they are redirected to login.
 * If the user is signed in but not an admin, they see a "No Access" screen.
 */
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-paper">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cobalt" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login and preserve the current path for post-login redirect
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-paper p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink">Administrative Access Required</h1>
          <p className="text-line-600">
            You do not have the necessary permissions to view this page. If you believe this is an error, please contact the system administrator.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-cobalt text-white rounded-md font-medium hover:bg-cobalt/90 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
