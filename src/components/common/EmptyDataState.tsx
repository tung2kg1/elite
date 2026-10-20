import React from 'react';
import { LucideIcon, Inbox, Plus, Database, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyDataStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  tag?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  compact?: boolean;
  className?: string;
}

export const EmptyDataState: React.FC<EmptyDataStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  tag = 'CHƯA CÓ DỮ LIỆU',
  primaryAction,
  secondaryAction,
  compact = false,
  className
}) => {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 transition-colors',
        compact ? 'py-8 px-4' : 'py-14 px-6',
        className
      )}
    >
      {/* Refined Icon Container - No ping animations, clean enterprise badge */}
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shadow-2xs mb-3">
        <Icon className="w-6 h-6 stroke-[1.6]" />
      </div>

      {/* Pill Badge */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-white text-slate-600 border border-slate-200 mb-2 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {tag}
      </span>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-900 mb-1 max-w-md">
        {title}
      </h3>

      {/* Subtitle / Explanation (only if provided) */}
      {description && (
        <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs hover:shadow-xs transition-colors cursor-pointer"
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            >
              {secondaryAction.icon ? (
                <secondaryAction.icon className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Database className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
