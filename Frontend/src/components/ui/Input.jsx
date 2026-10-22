import { cn } from '../../utils/cn';

export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <input
        className={cn(
          'px-3 py-2 rounded-md border bg-surface text-ink transition-colors',
          'border-line focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 outline-none',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
};
