
import { Link } from 'react-router-dom';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <ErrorState
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      action={<Link to="/"><Button>Go to Home</Button></Link>}
    />
  </div>
);

export default NotFoundPage;
