import { type ReactNode } from 'react';
import { cn } from '../../utils';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: T[keyof T], row: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  variant?: 'default' | 'dark' | 'compact';
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  rowKey?: keyof T | ((row: T, index: number) => string);
  stickyHeader?: boolean;
  className?: string;
  getRowClassName?: (row: T, index: number) => string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  variant = 'default',
  loading = false,
  loadingRows = 5,
  emptyMessage = 'No data available',
  onRowClick,
  rowKey,
  stickyHeader = false,
  className,
  getRowClassName,
}: DataTableProps<T>) {
  const containerClass = variant === 'dark' ? 'table-container-dark' : 'table-container';
  const rowClass = variant === 'dark' ? 'table-row-dark' : 'table-row-hover';
  const headerCellPadding = variant === 'compact' ? 'px-3 py-2' : 'px-5 py-4';
  const cellPadding = variant === 'compact' ? 'px-3 py-2' : 'px-5 py-4';

  const getRowKey = (row: T, index: number): string => {
    if (!rowKey) return String(index);
    if (typeof rowKey === 'function') return rowKey(row, index);
    return String(row[rowKey]);
  };

  const getValue = (row: T, key: keyof T | string): T[keyof T] | undefined => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj: Record<string, unknown> | undefined, k) => {
        if (obj && typeof obj === 'object' && k in obj) {
          return obj[k] as Record<string, unknown> | undefined;
        }
        return undefined;
      }, row as unknown as Record<string, unknown>) as T[keyof T] | undefined;
    }
    return row[key as keyof T];
  };

  if (loading) {
    return (
      <div className={cn(containerClass, className)}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 dark:border-navy-700/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'table-header',
                    headerCellPadding,
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.headerClassName
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className={rowClass}>
                {columns.map((col, j) => (
                  <td key={j} className={cn(cellPadding, col.cellClassName)}>
                    <Skeleton variant="text" width={col.width || '80%'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn(containerClass, className)}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 dark:border-navy-700/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'table-header',
                    headerCellPadding,
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.headerClassName
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="empty-state">
          <span>{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(containerClass, className)}>
      <table className="w-full text-sm">
        <thead className={stickyHeader ? 'sticky top-0 bg-inherit z-10' : ''}>
          <tr className="border-b border-navy-100 dark:border-navy-700/50">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  'table-header',
                  headerCellPadding,
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  col.headerClassName
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              className={cn(
                rowClass,
                rowIndex === data.length - 1 && 'border-b-0',
                onRowClick && 'cursor-pointer',
                getRowClassName?.(row, rowIndex)
              )}
              onClick={() => onRowClick?.(row, rowIndex)}
            >
              {columns.map((col, colIndex) => {
                const value = getValue(row, col.key);
                return (
                  <td
                    key={colIndex}
                    className={cn(
                      cellPadding,
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                      col.cellClassName
                    )}
                  >
                    {col.render
                      ? col.render(value as T[keyof T], row, rowIndex)
                      : (value !== null && value !== undefined ? String(value) : '')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
