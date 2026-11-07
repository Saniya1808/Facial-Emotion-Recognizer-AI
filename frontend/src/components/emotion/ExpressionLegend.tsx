import React from 'react';
import { EmotionBadge } from './EmotionBadge';
import { ExpressionClass } from '../../types';
import { Info } from 'lucide-react';

export const ExpressionLegend: React.FC = () => {
  const classes: ExpressionClass[] = [
    'Angry',
    'Disgust',
    'Fear',
    'Happy',
    'Sad',
    'Surprise',
    'Neutral',
  ];

  return (
    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          Target Expression Categories (7-Class Taxonomy)
        </h4>
      </div>

      <div className="flex flex-wrap gap-2">
        {classes.map((cls) => (
          <EmotionBadge key={cls} expression={cls} />
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 flex-shrink-0 text-brand-cyan mt-0.5" />
        <p className="leading-relaxed">
          <strong>Scientific Principle:</strong> Our custom CNN is designed to classify visible, morphological facial muscle movements (action units) rather than asserting an individual&apos;s true internal psychological state.
        </p>
      </div>
    </div>
  );
};

