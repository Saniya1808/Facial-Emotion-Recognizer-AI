import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'blue' | 'pista' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'cyan',
  size = 'md',
  pulse = false,
  className,
  children,
  ...props
}) => {
  const variants = {
    cyan: 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30',
    blue: 'bg-brand-blue/15 text-blue-400 border border-blue-500/30',
    pista: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    slate: 'bg-slate-700/30 text-slate-300 border border-slate-600/40',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium tracking-wide',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 font-mono select-none', variants[variant], sizes[size], className)}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );
};

