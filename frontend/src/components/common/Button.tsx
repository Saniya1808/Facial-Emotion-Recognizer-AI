import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants = {
      primary:
        'bg-gradient-to-r from-brand-cyan to-brand-blue text-brand-darker font-semibold shadow-subtle-glow hover:brightness-110 active:brightness-95',
      secondary:
        'bg-brand-card dark:bg-slate-800 text-slate-100 hover:bg-slate-700/80 border border-brand-border',
      outline:
        'bg-transparent border border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan/10 hover:border-brand-cyan',
      ghost:
        'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5 dark:hover:bg-slate-800/50',
      danger:
        'bg-rose-600 text-white hover:bg-rose-500 shadow-sm active:bg-rose-700',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

