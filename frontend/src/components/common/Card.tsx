import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'highlight' | 'flat';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const variants = {
    default:
      'bg-brand-card/70 dark:bg-slate-900/70 border border-brand-border dark:border-slate-800 backdrop-blur-md shadow-card-dark rounded-xl',
    glass:
      'bg-white/5 dark:bg-slate-900/40 border border-white/10 dark:border-white/5 backdrop-blur-lg shadow-card-dark rounded-xl',
    highlight:
      'bg-gradient-to-b from-brand-card to-brand-navy border border-brand-cyan/20 shadow-subtle-glow rounded-xl',
    flat: 'bg-brand-navy/60 dark:bg-slate-900/60 border border-white/5 rounded-xl',
  };

  return (
    <div className={cn(variants[variant], 'p-5 transition-all duration-200', className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('flex items-center justify-between pb-3 mb-3 border-b border-white/5', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn('text-base font-semibold text-slate-100 dark:text-slate-100 flex items-center gap-2', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs text-slate-400 mt-0.5 leading-relaxed', className)} {...props}>
    {children}
  </p>
);

