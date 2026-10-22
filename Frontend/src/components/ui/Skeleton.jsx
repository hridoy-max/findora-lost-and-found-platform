import { cn } from '../../utils/cn';

export const Skeleton = ({ className = 'bg-line/50' }) => (
  <div className={cn('animate-pulse rounded-md', className)} />
);
