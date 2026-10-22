import { cn } from '../../utils/cn';

export const Button = ({ 
  children, 
  variant = 'primary', 
  disabled = false, 
  isLoading = false, 
  className = '', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-cobalt text-surface hover:bg-cobalt/90',
    secondary: 'bg-surface text-ink border border-line hover:bg-paper',
    destructive: 'bg-danger text-surface hover:bg-danger/90',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
};

const Spinner = ({ size = 'md' }) => (
  <div className={cn(
    'animate-spin rounded-full border-2 border-current border-t-transparent',
    size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'
  )} />
);
