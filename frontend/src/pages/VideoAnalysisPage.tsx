import React, { useState, useRef } from 'react';
import {
  Video,
  Film,
  CheckCircle2,
  Layers,
  AlertCircle,
  Clock,
  Download,
  RotateCcw,
  Play,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Dropzone } from '../components/upload/Dropzone';
import { EmotionBadge } from '../components/emotion/EmotionBadge';
import { ExpressionLegend } from '../components/emotion/ExpressionLegend';
import { apiService } from '../services/api';
import { VideoPredictionResponse, ExpressionClass, TemporalFrameResult } from '../types';
import { useToast } from '../hooks/useToast';

export const VideoAnalysisPage: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [result, setResult] = useState<VideoPredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<TemporalFrameResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const toast = useToast();

  const handleVideoSelected = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedVideo(file);
    setResult(null);
    setErrorMessage(null);
    setSelectedFrame(null);
    setUploadProgress(0);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      toast.info('Video Attached', `Loaded "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedVideo) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setUploadProgress(0);

    try {
      const response = await apiService.predictVideo(selectedVideo, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      setResult(response);
      if (response.timeline.length > 0) {
        setSelectedFrame(response.timeline[0]);
      }
      toast.success(
        'Temporal Analysis Complete',
        `Analyzed ${response.total_frames_sampled} keyframes across ${response.duration_sec}s. Dominant: ${response.dominant_expression || 'None'}.`
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to complete video facial expression analysis.';
      setErrorMessage(msg);
      toast.error('Video Analysis Failed', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedVideo(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setSelectedFrame(null);
    setUploadProgress(0);
  };

  const seekVideoToTimestamp = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      videoRef.current.play().catch(() => {});
    }
  };

  // Export JSON
  const handleExportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.filename.replace(/\.[^/.]+$/, '')}_expression_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export Successful', 'Analysis exported as JSON.');
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!result) return;
    const headers = [
      'frame_index',
      'timestamp_sec',
      'timestamp_formatted',
      'faces_detected',
      'primary_expression',
      'confidence',
      'angry',
      'disgust',
      'fear',
      'happy',
      'neutral',
      'sad',
      'surprise',
    ];

    const rows = result.timeline.map((t) => {
      const p = t.probabilities || {};
      return [
        t.frame_index,
        t.timestamp_sec,
        `"${t.timestamp_formatted}"`,
        t.faces_detected,
        `"${t.primary_expression || ''}"`,
        t.confidence !== null && t.confidence !== undefined ? t.confidence : '',
        p.angry ?? '',
        p.disgust ?? '',
        p.fear ?? '',
        p.happy ?? '',
        p.neutral ?? '',
        p.sad ?? '',
        p.surprise ?? '',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.filename.replace(/\.[^/.]+$/, '')}_expression_timeline.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export Successful', 'Analysis exported as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-brand-cyan" />
            Video Sequence Expression Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Temporal keyframe downsampling, face detection, and custom CNN classification over sequential frames.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="md">
            Max 50 MB / 120s
          </Badge>
          <Badge variant="pista" size="md">
            FER-2013 Model: 45.24% Acc
          </Badge>
        </div>
      </div>

      {/* Main Upload / File Selection Dropzone */}
      <Card variant="glass" className="space-y-4">
        <CardHeader>
          <div>
            <CardTitle>Video File Ingestion</CardTitle>
            <CardDescription>
              Upload an MP4, WebM, or MOV video with visible faces (maximum 50 MB, 120 seconds)
            </CardDescription>
          </div>
        </CardHeader>

        <Dropzone
          accept="video/mp4,video/webm,video/quicktime"
          allowedExtensions={['.mp4', '.webm', '.mov']}
          maxSizeMB={50}
          isVideo={true}
          selectedFile={selectedVideo}
          onFileSelected={handleVideoSelected}
        />

        {selectedVideo && !result && (
          <div className="space-y-3 pt-2">
            {/* Video Player Preview Before Analysis */}
            {previewUrl && (
              <div className="max-w-xl mx-auto rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-lg">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  className="w-full max-h-72 object-contain"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="md" onClick={handleReset} disabled={isProcessing}>
                Clear
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleAnalyze}
                isLoading={isProcessing}
                leftIcon={<Film className="w-4 h-4" />}
              >
                {isProcessing
                  ? uploadProgress < 100
                    ? `Uploading (${uploadProgress}%)...`
                    : 'Running Temporal CNN Inference...'
                  : 'Start Video Expression Analysis'}
              </Button>
            </div>

            {/* Progress Bar during upload */}
            {isProcessing && (
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>
                    {uploadProgress < 100 ? 'Streaming video to backend...' : 'Extracting keyframes & evaluating faces...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-cyan rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Error Display */}
      {errorMessage && (
        <Card variant="default" className="border-rose-500/30 bg-rose-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-rose-200">Video Analysis Error</h4>
              <p className="text-xs text-rose-300/80 leading-relaxed">{errorMessage}</p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Retry Analysis
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Actual Video Analysis Results View */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Video Summary Banner */}
          <Card variant="highlight" className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-100">
                    Temporal Facial Expression Summary
                  </h3>
                  <Badge variant="pista" size="sm">
                    {result.total_frames_sampled} Keyframes Sampled
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  File: <span className="text-slate-200">{result.filename}</span> &bull; Duration:{' '}
                  <span className="text-brand-cyan">{result.duration_sec}s</span> &bull; Processing:{' '}
                  <span className="text-brand-cyan">{result.processing_time_ms} ms</span>
                </p>
              </div>

              {/* Export Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportJson}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Export JSON
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCsv}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {/* High-Level Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
              {/* Box 1: Dominant Expression */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Dominant Expression
                </span>
                <div>
                  {result.dominant_expression ? (
                    <EmotionBadge
                      expression={result.dominant_expression as ExpressionClass}
                      className="text-sm px-3 py-1.5 uppercase font-bold"
                    />
                  ) : (
                    <span className="text-sm font-mono text-slate-500">None Detected</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Highest frequency classification across video.
                </p>
              </div>

              {/* Box 2: Average Confidence */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Average Confidence
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-brand-cyan">
                    {result.average_confidence !== null
                      ? `${(result.average_confidence * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Mean softmax score across detected face instances.
                </p>
              </div>

              {/* Box 3: Face Detection Frequency */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Face Presence
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {result.frames_with_faces} / {result.total_frames_sampled}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({((result.frames_with_faces / Math.max(1, result.total_frames_sampled)) * 100).toFixed(0)}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Keyframes containing at least one localized face.
                </p>
              </div>

              {/* Box 4: Total Face Detections */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Total Faces Detected
                </span>
                <div>
                  <span className="text-2xl font-bold font-mono text-slate-200">
                    {result.total_faces_detected}
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-2">
                    (~{result.average_faces_detected} / frame)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Cumulative count across all temporal samples.
                </p>
              </div>
            </div>
          </Card>

          {/* Video Preview & Playback Synchronization */}
          {previewUrl && (
            <Card variant="glass" className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                  <Play className="w-3.5 h-3.5 text-brand-cyan" />
                  Video Playback Synchronization
                </span>
                <span className="text-xs text-slate-400">
                  Click any timeline keyframe below to seek video to that timestamp.
                </span>
              </div>
              <div className="max-w-xl mx-auto rounded-xl overflow-hidden bg-black/80 border border-white/10">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  className="w-full max-h-80 object-contain"
                />
              </div>
            </Card>
          )}

          {/* 7-Class Distribution Visualizer */}
          <Card variant="default" className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>
                  <Layers className="w-4 h-4 text-brand-cyan" />
                  <span>Cumulative Expression Distribution</span>
                </CardTitle>
                <CardDescription>
                  Percentage breakdown across all sampled keyframes throughout the video
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-2.5 pt-1">
              {Object.entries(result.expression_distribution)
                .sort(([, a], [, b]) => b - a)
                .map(([emotion, pct]) => {
                  const isTop = emotion.toLowerCase() === result.dominant_expression?.toLowerCase();
                  return (
                    <div key={emotion} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className={`capitalize ${isTop ? 'text-brand-cyan font-bold' : 'text-slate-300'}`}>
                          {emotion} {isTop && '★'}
                        </span>
                        <span className={isTop ? 'text-brand-cyan font-bold' : 'text-slate-400'}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop ? 'bg-gradient-to-r from-brand-cyan to-brand-blue' : 'bg-slate-600/70'
                          }`}
                          style={{ width: `${Math.max(Number(pct), 1.5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Interactive Expression Timeline */}
          <Card variant="default" className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>
                  <Clock className="w-4 h-4 text-brand-cyan" />
                  <span>Sampled Expression Timeline</span>
                </CardTitle>
                <CardDescription>
                  Click any frame to seek video playback and inspect facial action probabilities
                </CardDescription>
              </div>
            </CardHeader>

            {/* Horizontal Timeline Strip */}
            <div className="overflow-x-auto pb-2">
              <div className="flex items-center gap-2 min-w-max p-2 rounded-xl bg-black/40 border border-white/5">
                {result.timeline.map((frame) => {
                  const isSelected = selectedFrame?.frame_index === frame.frame_index;
                  const hasFace = frame.faces_detected > 0;
                  return (
                    <button
                      key={frame.frame_index}
                      onClick={() => {
                        setSelectedFrame(frame);
                        seekVideoToTimestamp(frame.timestamp_sec);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all font-mono ${
                        isSelected
                          ? 'bg-brand-cyan/20 border-brand-cyan shadow-sm scale-105'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                        <span>#{frame.frame_index}</span>
                        <span className="text-slate-200 font-semibold">{frame.timestamp_formatted}</span>
                      </div>
                      <div className="pt-1.5 flex items-center gap-1.5">
                        {hasFace && frame.primary_expression ? (
                          <EmotionBadge
                            expression={frame.primary_expression as ExpressionClass}
                            className="text-[10px] px-2 py-0.5 uppercase"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No Face</span>
                        )}
                      </div>
                      {hasFace && frame.confidence !== null && (
                        <div className="text-[10px] text-brand-cyan font-bold pt-1">
                          {(frame.confidence * 100).toFixed(0)}% conf
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Inspection for Selected Keyframe */}
            {selectedFrame && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-brand-cyan/30 space-y-3 mt-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 font-mono">
                      Keyframe #{selectedFrame.frame_index} at {selectedFrame.timestamp_formatted} ({selectedFrame.timestamp_sec}s)
                    </span>
                    <Badge variant={selectedFrame.faces_detected > 0 ? 'pista' : 'amber'} size="sm">
                      {selectedFrame.faces_detected} Face{selectedFrame.faces_detected > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seekVideoToTimestamp(selectedFrame.timestamp_sec)}
                    leftIcon={<Play className="w-3 h-3 text-brand-cyan" />}
                  >
                    Seek Video
                  </Button>
                </div>

                {selectedFrame.faces_detected > 0 && selectedFrame.primary_expression ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span>
                        Primary Expression:{' '}
                        <strong className="text-brand-cyan capitalize">
                          {selectedFrame.primary_expression}
                        </strong>
                      </span>
                      <span>
                        Confidence:{' '}
                        <strong className="text-brand-cyan">
                          {selectedFrame.confidence !== null
                            ? `${(selectedFrame.confidence * 100).toFixed(1)}%`
                            : 'N/A'}
                        </strong>
                      </span>
                    </div>

                    {/* Probability Breakdown for Keyframe */}
                    {selectedFrame.probabilities && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-mono text-slate-400">
                          Softmax Probability Vector:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-1">
                          {Object.entries(selectedFrame.probabilities).map(([emotion, prob]) => {
                            const isTop = emotion.toLowerCase() === selectedFrame.primary_expression?.toLowerCase();
                            return (
                              <div
                                key={emotion}
                                className={`p-2 rounded text-[11px] font-mono border ${
                                  isTop
                                    ? 'bg-brand-cyan/20 border-brand-cyan/50 text-brand-cyan font-bold'
                                    : 'bg-black/30 border-white/5 text-slate-400'
                                }`}
                              >
                                <div className="capitalize">{emotion}</div>
                                <div className="font-bold">{(prob * 100).toFixed(1)}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No frontal human face was localized in this sampled keyframe.
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Affective Computing Ethical Statement */}
          <Card variant="glass" className="p-4 border-brand-cyan/20">
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <Info className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-200">
                  Scientific Affective Computing Statement
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {result.disclaimer} Temporal sequence analysis samples discrete keyframes and evaluates morphological action units; it does not claim continuous biometric tracking or ground-truth psychological emotion detection.
                </p>
              </div>
            </div>
          </Card>

          {/* New Analysis Action */}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="md" onClick={handleReset}>
              Analyze Another Video
            </Button>
          </div>
        </div>
      )}

      {/* Target Expression Taxonomy Reference */}
      <ExpressionLegend />
    </div>
  );
};
