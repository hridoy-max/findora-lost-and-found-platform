import React from 'react';
import { cn } from '../../utils/cn';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * @typedef {Object} Column
 * @property {string} key - The data key to render
 * @property {string} label - The display label for the header
 * @property {function} [render] - Custom render function (value, row) => ReactNode
 * @property {boolean} [sortable] - Whether this column can be sorted
 */

/**
 * A professional data table for admin management.
 * Handles responsive scrolling, loading states, and sorting triggers.
 */
const DataTable = ({
  columns,
  data,
  isLoading,
  onSort,
  currentSort = { key: '', order: 'desc' }
}) => {
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line">
              {columns.map(col => (
                <th key={col.key} className="p-4 text-xs font-bold uppercase text-line-600">
                  <Skeleton width={80} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-line">
                {columns.map(col => (
                  <td key={col.key} className="p-4">
                    <Skeleton width="100%" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No records found"
        description="There is currently no data available for this table."
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-line rounded-xl bg-surface">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-paper border-b border-line">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  "p-4 text-xs font-bold uppercase text-line-600 transition-colors",
                  col.sortable && "cursor-pointer hover:text-ink select-none"
                )}
                onClick={() => col.sortable && onSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {col.sortable && (
                    <SortIcon key={col.key} currentSort={currentSort} sortKey={col.key} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex} className="hover:bg-paper/50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="p-4 text-sm text-ink/80">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SortIcon = ({ currentSort, sortKey }) => {
  if (currentSort.key !== sortKey) {
    return <ChevronsUpDown size={14} className="text-line-400" />;
  }
  return currentSort.order === 'asc' ?
    <ChevronUp size={14} className="text-cobalt" /> :
    <ChevronDown size={14} className="text-cobalt" />;
};

export default DataTable;
