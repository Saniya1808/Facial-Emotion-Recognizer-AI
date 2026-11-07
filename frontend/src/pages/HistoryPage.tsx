import React, { useEffect, useState, useCallback } from 'react';
import {
  History,
  Trash2,
  Filter,
  ShieldCheck,
  Database,
  Camera,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { EmotionBadge } from '../components/emotion/EmotionBadge';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { AnalysisRecordItem } from '../types';

export const HistoryPage: React.FC = () => {
  const { addToast } = useToast();
  const [records, setRecords] = useState<AnalysisRecordItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: { limit: number; offset: number; input_mode?: string } = {
        limit: 50,
        offset: 0,
      };
      if (selectedMode !== 'all') {
        params.input_mode = selectedMode;
      }
      const data = await apiService.getHistory(params);
      setRecords(data.records);
      setTotalCount(data.total);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to load history',
        message: err?.response?.data?.detail || 'Could not connect to database.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedMode, addToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClearHistory = async () => {
    try {
      setIsClearing(true);
      const res = await apiService.clearHistory();
      setShowClearConfirm(false);
      addToast({
        type: 'success',
        title: 'History Cleared',
        message: `Purged ${res.deleted_count} record(s) from database.`,
      });
      fetchHistory();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Purge Failed',
        message: err?.response?.data?.detail || 'Could not clear database history.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      await apiService.deleteHistoryRecord(id);
      addToast({
        type: 'success',
        title: 'Record Removed',
        message: `Analysis #${id} was deleted.`,
      });
      fetchHistory();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err?.response?.data?.detail || 'Could not delete record.',
      });
    }
  };

  const handleExport = (type: 'excel' | 'csv') => {
    const url = type === 'excel' ? apiService.getExcelReportUrl() : apiService.getCsvReportUrl();
    window.open(url, '_blank');
    addToast({
      type: 'info',
      title: `Exporting ${type.toUpperCase()}`,
      message: 'Report download initialized.',
    });
  };

  const getModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'webcam':
        return <Camera className="w-3.5 h-3.5 text-brand-cyan" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-brand-blue" />;
      case 'image':
      default:
        return <ImageIcon className="w-3.5 h-3.5 text-brand-pista" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-cyan" />
            Analysis History & Audit Records
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Privacy-conscious persistent log of facial expression evaluations and exportable reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={totalCount === 0}
            title="Download formatted 2-sheet Excel report with metadata and summary"
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
          >
            Export Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={totalCount === 0}
            title="Download CSV table for statistical analysis"
            leftIcon={<FileText className="w-3.5 h-3.5 text-brand-cyan" />}
          >
            Export CSV
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            disabled={totalCount === 0 || isClearing}
            title="Purge all audit records from SQLite"
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            className="text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
          >
            Clear History
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHistory}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            title="Reload records"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing History */}
      {showClearConfirm && (
        <Card variant="default" className="border-rose-500/30 bg-rose-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold text-rose-200">
                Confirm Database History Purge
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete all {totalCount} historical analysis record(s)? This action permanently removes session timestamps, expression classifications, and confidence statistics from SQLite.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleClearHistory}
                  disabled={isClearing}
                  className="bg-rose-600 hover:bg-rose-500 border-none text-white text-xs"
                >
                  {isClearing ? 'Purging...' : 'Yes, Delete All Records'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter and Table Container */}
      <Card variant="glass" className="space-y-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Session History</CardTitle>
            <Badge variant="slate" size="sm">
              {totalCount} Record{totalCount === 1 ? '' : 's'}
            </Badge>
          </div>

          {/* Mode Filter Pills */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5 text-xs">
            <Filter className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
            {(['all', 'image', 'webcam', 'video'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`px-2.5 py-1 rounded-lg capitalize font-mono text-xs transition-colors ${
                  selectedMode === mode
                    ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </CardHeader>

        {/* Content: Table or Empty State */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-cyan mb-2" />
            Loading historical records...
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/30 text-slate-300">
                <tr>
                  <th className="p-3 rounded-l">ID</th>
                  <th className="p-3">Input Mode</th>
                  <th className="p-3">Faces</th>
                  <th className="p-3">Primary Expression</th>
                  <th className="p-3">Softmax Confidence</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3 rounded-r text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-slate-500 font-mono">#{r.id}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[11px] capitalize">
                        {getModeIcon(r.input_mode)}
                        <span>{r.input_mode}</span>
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-200">
                      {r.faces_detected}
                    </td>
                    <td className="p-3">
                      {r.primary_expression ? (
                        <EmotionBadge
                          expression={r.primary_expression}
                          confidence={r.confidence ?? undefined}
                        />
                      ) : (
                        <span className="text-slate-500 italic">No face detected</span>
                      )}
                    </td>
                    <td className="p-3">
                      {r.confidence !== null && r.confidence !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-cyan rounded-full"
                              style={{ width: `${Math.min(100, r.confidence * 100)}%` }}
                            />
                          </div>
                          <span>{(r.confidence * 100).toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">
                      {r.processing_time_ms ? `${Math.round(r.processing_time_ms)} ms` : '—'}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteRecord(r.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete single record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Database}
            title={selectedMode === 'all' ? 'No Historical Analyses Recorded' : `No ${selectedMode.toUpperCase()} Records`}
            badgeText="Clean Database"
            description={
              selectedMode === 'all'
                ? 'Your analysis session history will automatically appear here once you execute live webcam, image, or video recognition.'
                : `No analysis runs recorded with input mode '${selectedMode}'. Try selecting 'All' or running a new analysis.`
            }
          />
        )}
      </Card>

      {/* Privacy Guarantee Card */}
      <Card variant="default">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">
              Zero Raw Media Storage Policy
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Only non-biometric statistical metadata (expression category percentages, face bounding dimensions, timestamps, and pipeline latencies) are retained in SQLite. Raw camera frames, identifiable video clips, and photographs are discarded immediately upon classification.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
