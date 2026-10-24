import { cn } from '../../utils/cn';
import { Button } from './Button';

export const EmptyState = ({ title, description, action, className = '' }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-4 text-center',
    className
  )}>
    <div className="w-16 h-16 bg-paper rounded-full flex items-center justify-center mb-4 border border-line">
      <span className="text-2xl">📦</span>
    </div>
    <h3 className="text-lg font-headings font-bold text-ink mb-2">{title}</h3>
    <p className="text-ink/60 max-w-xs mb-6">{description}</p>
    {action && (
      action.label ? (
        <Button onClick={action.onClick} variant="secondary">
          {action.label}
        </Button>
      ) : (
        action
      )
    )}
  </div>
);

export const ErrorState = ({ title, message, onRetry, className = '' }) => (
  <div className={cn(
    'flex flex-col items-center justify-center py-12 px-4 text-center',
    className
  )}>
    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
      <span className="text-2xl">⚠️</span>
    </div>
    <h3 className="text-lg font-headings font-bold text-ink mb-2">{title}</h3>
    <p className="text-ink/60 max-w-xs mb-6">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="secondary">Try Again</Button>
    )}
  </div>
);
