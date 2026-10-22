import { cn } from '../../utils/cn';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-3 h-3 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-4',
  };

  return (
    <div className={cn(
      'animate-spin rounded-full border-line border-t-cobalt',
      sizes[size],
      className
    )} />
  );
};
