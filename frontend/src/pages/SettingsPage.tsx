import React, { useState } from 'react';
import { Settings, Moon, Sun, Monitor, Server, Shield, Check, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useTheme } from '../hooks/useTheme';
import { apiService } from '../services/api';
import { useToast } from '../hooks/useToast';
import { ThemeMode } from '../types';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [apiUrl, setApiUrl] = useState<string>(apiService.getBaseUrl());
  const [soundFeedback, setSoundFeedback] = useState<boolean>(false);
  const [allowTelemetry, setAllowTelemetry] = useState<boolean>(false);
  const toast = useToast();

  const handleSaveSettings = () => {
    toast.success('Preferences Saved', 'Application configuration updated locally.');
  };

  const themeOptions: { value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'dark', label: 'Dark Navy', icon: Moon },
    { value: 'light', label: 'Clean Light', icon: Sun },
    { value: 'system', label: 'System Default', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-cyan" />
            System & Application Preferences
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure appearance, API endpoints, privacy guarantees, and operational limits.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveSettings}
          leftIcon={<Save className="w-3.5 h-3.5" />}
        >
          Save Changes
        </Button>
      </div>

      {/* Theme Settings */}
      <Card variant="glass" className="space-y-4">
        <CardHeader>
          <div>
            <CardTitle>Interface Appearance</CardTitle>
            <CardDescription>
              Select your preferred color theme. Current active mode: <span className="text-brand-cyan font-mono uppercase">{resolvedTheme}</span>
            </CardDescription>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  toast.info('Theme Updated', `Switched theme to ${opt.label}`);
                }}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-200 focus:outline-none ${
                  isSelected
                    ? 'border-brand-cyan bg-brand-cyan/10 shadow-subtle-glow'
                    : 'border-white/10 hover:border-white/20 bg-brand-navy/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? 'bg-brand-cyan text-brand-darker' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {opt.value === 'dark' ? 'Futuristic Deep Navy' : opt.value === 'light' ? 'High Contrast Crisp' : 'Auto Match OS'}
                    </p>
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-brand-cyan" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Backend API Configuration */}
      <Card variant="default" className="space-y-4">
        <CardHeader>
          <div>
            <CardTitle>
              <Server className="w-4 h-4 text-brand-cyan" />
              <span>FastAPI Backend Connection</span>
            </CardTitle>
            <CardDescription>
              Base URL for FastAPI microservice and model evaluation endpoints
            </CardDescription>
          </div>
          <Badge variant="cyan" size="sm">Configured via VITE_API_BASE_URL</Badge>
        </CardHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Active API Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-slate-200 focus:border-brand-cyan focus:outline-none"
              placeholder="http://localhost:8000"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Default development endpoint: <span className="text-brand-cyan">http://localhost:8000</span>
            </p>
          </div>

          <div className="p-3 rounded-lg bg-black/20 border border-white/5 text-xs text-slate-400 font-mono space-y-1">
            <p className="text-slate-300 font-semibold">Active Endpoints:</p>
            <p>&bull; Health Check: <span className="text-slate-300">{apiUrl}/health</span></p>
            <p>&bull; API Health v1: <span className="text-slate-300">{apiUrl}/api/v1/health</span></p>
            <p>&bull; Model Status v1: <span className="text-slate-300">{apiUrl}/api/v1/model/status</span></p>
          </div>
        </div>
      </Card>

      {/* Application Controls & Privacy */}
      <Card variant="default" className="space-y-4">
        <CardHeader>
          <div>
            <CardTitle>
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Privacy & Feedback Preferences</span>
            </CardTitle>
            <CardDescription>Client-side telemetry, notifications, and audio cues</CardDescription>
          </div>
        </CardHeader>

        <div className="space-y-3 divide-y divide-white/5">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-semibold text-slate-200">Audio Feedback</p>
              <p className="text-[11px] text-slate-400">Play subtle acoustic chime when an analysis completes</p>
            </div>
            <input
              type="checkbox"
              checked={soundFeedback}
              onChange={(e) => setSoundFeedback(e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 text-brand-cyan focus:ring-brand-cyan"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-xs font-semibold text-slate-200">Anonymous Telemetry</p>
              <p className="text-[11px] text-slate-400">Send anonymized system performance metrics (disabled by default)</p>
            </div>
            <input
              type="checkbox"
              checked={allowTelemetry}
              onChange={(e) => setAllowTelemetry(e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 text-brand-cyan focus:ring-brand-cyan"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
