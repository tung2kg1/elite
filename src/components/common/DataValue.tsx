import React from 'react';
import { cn } from '../../lib/utils';

interface DataValueProps {
  value?: string | number | null;
  placeholder?: string;
  className?: string;
  monospace?: boolean;
}

export const DataValue: React.FC<DataValueProps> = ({
  value,
  placeholder = '—',
  className,
  monospace = false
}) => {
  if (value === null || value === undefined || value === '') {
    return (
      <span
        className={cn(
          'text-slate-400 text-[11px] font-normal select-none inline-flex items-center gap-1',
          className
        )}
      >
        <span className="font-mono text-slate-300">—</span>
        {placeholder !== '—' && <span className="italic text-slate-400">{placeholder}</span>}
      </span>
    );
  }

  return (
    <span
      className={cn(
        monospace ? 'font-mono' : '',
        'text-slate-900',
        className
      )}
    >
      {value}
    </span>
  );
};
