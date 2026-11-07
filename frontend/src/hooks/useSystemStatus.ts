import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { StructuredHealthResponse, ModelStatusResponse } from '../types';

export function useSystemStatus(pollingIntervalMs: number = 30000) {
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [backendLoading, setBackendLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<StructuredHealthResponse | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setBackendLoading(true);
      const [health, model] = await Promise.all([
        apiService.getApiHealth(),
        apiService.getModelStatus(),
      ]);

      setHealthData(health);
      setModelStatus(model);
      setBackendConnected(health.status === 'healthy' || health.status === 'degraded');
      setBackendError(null);
    } catch (err: unknown) {
      setBackendConnected(false);
      const errorMsg = err instanceof Error ? err.message : 'Backend connection unavailable';
      setBackendError(errorMsg);
      // Even if backend fails, do not invent mock data
      setHealthData(null);
      setModelStatus(null);
    } finally {
      setBackendLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    if (pollingIntervalMs > 0) {
      const interval = setInterval(fetchStatus, pollingIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, pollingIntervalMs]);

  return {
    backendConnected,
    backendLoading,
    backendError,
    healthData,
    modelStatus,
    refreshStatus: fetchStatus,
  };
}

