import { Button } from './Button';
import { cn } from '../../utils/cn';

export const ErrorState = ({ title, message, onRetry, action, className = '' }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-4 text-center',
    className
  )}>
    <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-4 text-danger">
      <span className="text-2xl">⚠️</span>
    </div>
    <h3 className="text-lg font-headings font-bold text-ink mb-2">{title}</h3>
    <p className="text-ink/60 max-w-xs mb-6">{message}</p>
    {action || (onRetry && <Button variant="primary" onClick={onRetry}>Try Again</Button>)}
  </div>
);
