import React from 'react';
import { cn } from '../../utils/cn';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  badgeText?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  badgeText,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-white/10 bg-white/[0.02] dark:bg-slate-900/20',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-3 shadow-subtle-glow">
        <Icon className="w-6 h-6" />
      </div>
      {badgeText && (
        <span className="text-[11px] font-mono uppercase tracking-wider text-brand-cyan/80 bg-brand-cyan/5 px-2.5 py-0.5 rounded-full border border-brand-cyan/20 mb-2">
          {badgeText}
        </span>
      )}
      <h4 className="text-sm font-semibold text-slate-200 tracking-tight">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-xs font-medium text-brand-cyan hover:underline inline-flex items-center gap-1 focus:outline-none"
        >
          {actionText} &rarr;
        </button>
      )}
    </div>
  );
};

