import { cn } from '../../utils/cn';
import { useEffect, useRef } from 'react';

export const Modal = ({ isOpen, onClose, children, title, className = '' }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      // Focus the first focusable element in the modal
      const focusable = dialogRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        'rounded-xl bg-surface p-0 shadow-xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm',
        'max-w-lg w-full outline-none',
        className
      )}
    >
      <div className="flex flex-col">
        {title && (
          <div className="px-6 py-4 border-b border-line">
            <h3 className="text-lg font-headings font-bold text-ink">{title}</h3>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-ink hover:bg-paper transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
};
