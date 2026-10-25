import { cn } from '../../utils/cn';

/**
 * A professional textarea component that follows the project's design tokens.
 * Supports standard HTML textarea attributes and integrates with react-hook-form.
 */
export const Textarea = ({
  className,
  ...props
}) => {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-line bg-paper px-4 py-3 text-ink',
        'placeholder:text-line-400',
        'focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 outline-none transition-all',
        'disabled:bg-line-50 disabled:text-line-400 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
};

export default Textarea;
