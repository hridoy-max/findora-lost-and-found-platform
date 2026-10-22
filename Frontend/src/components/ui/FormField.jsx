import React from 'react';

/**
 * FormField provides a consistent layout for labels and error messages
 * around any input component.
 */
export const FormField = ({ label, error, children }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-ink/80">
          {label}
        </label>
      )}
      {children}
      {error && (
        <span className="text-xs text-danger font-medium">
          {error}
        </span>
      )}
    </div>
  );
};

export default FormField;
