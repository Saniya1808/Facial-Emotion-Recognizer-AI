import React from 'react';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { ExpressionClass } from '../../types';

interface ExpressionDistributionChartProps {
  distribution?: Record<ExpressionClass, number> | null;
  className?: string;
}

export const ExpressionDistributionChart: React.FC<ExpressionDistributionChartProps> = ({
  distribution,
  className,
}) => {
  const hasData = distribution && Object.values(distribution).some((v) => v > 0);

  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No Expression Analytics Available"
        badgeText="Empty State"
        description="Expression distribution statistics will populate in real-time once the Phase 2 TensorFlow/Keras CNN model is trained and inferences are executed."
        className={className}
      />
    );
  }

  // When data is available (Phase 2), render the distribution bars
  const total = Object.values(distribution).reduce((acc, v) => acc + v, 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {Object.entries(distribution).map(([expression, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={expression} className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">{expression}</span>
              <span className="text-slate-400">
                {count} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-cyan to-brand-blue rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

