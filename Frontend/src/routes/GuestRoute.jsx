
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { safeNext } from '../utils/safeNext';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;

  if (isAuthenticated) {
    // Redirect signed-in users away from auth pages
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    return <Navigate to={safeNext(next)} replace />;
  }

  return children;
};

export default GuestRoute;
