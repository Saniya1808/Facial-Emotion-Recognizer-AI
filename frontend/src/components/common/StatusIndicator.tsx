import React from 'react';
import { Server, Cpu, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from './Badge';

interface StatusIndicatorProps {
  backendConnected: boolean;
  backendLoading: boolean;
  modelStatus?: string | null;
  onRefresh?: () => void;
  compact?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  backendConnected,
  backendLoading,
  modelStatus,
  onRefresh,
  compact = false,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Backend Connectivity Status */}
      <div className="flex items-center gap-1.5" title="FastAPI Backend Connectivity">
        <Server className="w-3.5 h-3.5 text-slate-400" />
        {backendLoading ? (
          <Badge variant="slate" size="sm">
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            Connecting...
          </Badge>
        ) : backendConnected ? (
          <Badge variant="pista" size="sm" pulse>
            Backend Connected
          </Badge>
        ) : (
          <Badge variant="rose" size="sm">
            <AlertCircle className="w-2.5 h-2.5" />
            Backend Unavailable
          </Badge>
        )}
      </div>

      {/* Model Engine Status */}
      <div className="flex items-center gap-1.5" title="TensorFlow / Keras CNN Model Inference State">
        <Cpu className="w-3.5 h-3.5 text-slate-400" />
        {modelStatus === 'trained' ? (
          <Badge variant="pista" size="sm" pulse>
            Model: Trained (FER-2013)
          </Badge>
        ) : modelStatus === 'not_trained' || !modelStatus ? (
          <Badge variant="amber" size="sm">
            Model: Not Trained
          </Badge>
        ) : (
          <Badge variant="slate" size="sm">
            Model: {modelStatus}
          </Badge>
        )}
      </div>

      {onRefresh && !compact && (
        <button
          onClick={onRefresh}
          className="p-1 text-slate-400 hover:text-brand-cyan hover:bg-white/5 rounded transition-colors"
          title="Refresh connection status"
          aria-label="Refresh status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${backendLoading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};
