import React from 'react';
import { ExpressionClass } from '../../types';
import { cn } from '../../utils/cn';

interface EmotionBadgeProps {
  expression: ExpressionClass | string;
  confidence?: number;
  className?: string;
}

export const EmotionBadge: React.FC<EmotionBadgeProps> = ({
  expression,
  confidence,
  className,
}) => {
  const normKey = (expression.charAt(0).toUpperCase() + expression.slice(1).toLowerCase());

  const styles: Record<string, string> = {
    Angry: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    Disgust: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Fear: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    Happy: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    Sad: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    Surprise: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    Neutral: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border select-none',
        styles[normKey] || styles.Neutral,
        className
      )}
    >
      <span className="font-semibold">{normKey}</span>
      {confidence !== undefined && (
        <span className="opacity-80 text-[10px]">({(confidence * 100).toFixed(1)}%)</span>
      )}
    </span>
  );
};
