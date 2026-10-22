import { cn } from '../../utils/cn';

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    neutral: 'bg-line text-ink',
    cobalt: 'border border-cobalt text-cobalt bg-cobalt/5',
    found: 'bg-found text-surface',
    lost: 'bg-lost text-surface',
    danger: 'bg-danger text-surface',
    amber: 'bg-amber-100 text-amber-800', 
    grey: 'bg-gray-200 text-gray-600',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
      variants[variant] || variants.neutral,
      className
    )}>
      {children}
    </span>
  );
};
