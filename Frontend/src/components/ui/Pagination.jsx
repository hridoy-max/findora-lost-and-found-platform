import { cn } from '../../utils/cn';

export const Pagination = ({ totalPages, currentPage, onPageChange, className = '' }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className={cn('flex items-center justify-center gap-2 py-4', className)}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2 rounded-md border border-line disabled:opacity-50 hover:bg-paper transition-colors"
      >
        ←
      </button>
      
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'w-9 h-9 rounded-md text-sm font-medium transition-colors',
            currentPage === p ? 'bg-cobalt text-surface' : 'text-ink hover:bg-paper border border-transparent'
          )}
        >
          {p}
        </button>
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-2 rounded-md border border-line disabled:opacity-50 hover:bg-paper transition-colors"
      >
        →
      </button>
    </div>
  );
};
