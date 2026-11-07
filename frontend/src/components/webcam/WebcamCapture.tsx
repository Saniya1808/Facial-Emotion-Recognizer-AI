import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Layers,
  Sliders,
  Gauge,
  Camera as SnapshotIcon,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EmotionBadge } from '../emotion/EmotionBadge';
import { ExpressionClass, FacePrediction, ImagePredictionResponse } from '../../types';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface WebcamCaptureProps {
  onStatusChange?: (isActive: boolean) => void;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onStatusChange }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings
  const [targetFps, setTargetFps] = useState<number>(2); // 1, 2, or 3 FPS
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(20); // 0-100%
  const [isLiveInferenceEnabled, setIsLiveInferenceEnabled] = useState<boolean>(true);

  // Live Metrics & Predictions
  const [latestResult, setLatestResult] = useState<ImagePredictionResponse | null>(null);
  const [selectedFaceId, setSelectedFaceId] = useState<number>(1);
  const [isRequestInFlight, setIsRequestInFlight] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [snapshotResult, setSnapshotResult] = useState<ImagePredictionResponse | null>(null);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const toast = useToast();

  // Stop camera and cleanup tracks
  const stopStream = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear overlay canvas
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }

    inFlightRef.current = false;
    setIsRequestInFlight(false);
    setIsActive(false);
    setLatestResult(null);
    setLatencyMs(null);
    if (onStatusChange) onStatusChange(false);
  }, [onStatusChange]);

  // Start Camera Stream
  const startStream = async () => {
    setErrorMessage(null);
    setSnapshotResult(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API is unavailable. Please verify browser compatibility or HTTPS connection.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      if (onStatusChange) onStatusChange(true);
      toast.success('Camera Connected', 'Live feed initialized with zero server-side frame retention.');
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Failed to acquire camera permission.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was explicitly denied. Please enable camera access in your browser site permissions.';
        setPermissionState('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No video capture hardware detected on this workstation.';
        setPermissionState('error');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application or tab.';
        setPermissionState('error');
      } else {
        msg = err.message || msg;
        setPermissionState('error');
      }
      setErrorMessage(msg);
      setIsActive(false);
      if (onStatusChange) onStatusChange(false);
    }
  };

  // Capture single frame from video element into JPEG File
  const captureFrameFile = useCallback((): File | null => {
    if (!videoRef.current || !hiddenCanvasRef.current) return null;
    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    if (width === 0 || height === 0) return null;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw without horizontal flip for backend processing so orientation matches standard photos
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const arr = dataUrl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: 'image/jpeg' });
    return new File([blob], 'webcam_frame.jpg', { type: 'image/jpeg' });
  }, []);

  // Draw Bounding Boxes on Overlay Canvas
  const drawOverlay = useCallback(
    (predictions: FacePrediction[], videoWidth: number, videoHeight: number) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;

      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!predictions || predictions.length === 0) return;

      predictions.forEach((pred) => {
        if (!pred.box) return;

        const { x, y, width, height } = pred.box;
        const isAboveThreshold = pred.confidence >= confidenceThreshold / 100;

        // Note: The video element is CSS-mirrored (`transform: scaleX(-1)`), so we invert X on overlay
        const displayX = videoWidth - (x + width);

        // Box border
        ctx.strokeStyle = isAboveThreshold ? '#00f5d4' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(displayX, y, width, height);

        // Corner accents
        const cornerLen = Math.min(16, width / 4, height / 4);
        ctx.lineWidth = 4;
        ctx.strokeStyle = isAboveThreshold ? '#38bdf8' : '#fbbf24';

        // Top-left
        ctx.beginPath();
        ctx.moveTo(displayX, y + cornerLen);
        ctx.lineTo(displayX, y);
        ctx.lineTo(displayX + cornerLen, y);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(displayX + width - cornerLen, y);
        ctx.lineTo(displayX + width, y);
        ctx.lineTo(displayX + width, y + cornerLen);
        ctx.stroke();

        // Label background & text
        const label = isAboveThreshold
          ? `${pred.primary_expression.toUpperCase()} ${(pred.confidence * 100).toFixed(0)}%`
          : `LOW CONF (${(pred.confidence * 100).toFixed(0)}%)`;

        ctx.font = 'bold 12px "Space Grotesk", monospace';
        const textWidth = ctx.measureText(label).width;
        const labelHeight = 20;
        const labelY = Math.max(0, y - labelHeight - 4);

        ctx.fillStyle = isAboveThreshold ? 'rgba(0, 245, 212, 0.9)' : 'rgba(245, 158, 11, 0.9)';
        ctx.fillRect(displayX, labelY, textWidth + 12, labelHeight);

        ctx.fillStyle = '#060a17';
        ctx.fillText(label, displayX + 6, labelY + 14);
      });
    },
    [confidenceThreshold]
  );

  // Send single frame to real inference API
  const runFrameInference = useCallback(async () => {
    if (!isActive || inFlightRef.current || !isLiveInferenceEnabled) return;
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    const frameFile = captureFrameFile();
    if (!frameFile) return;

    inFlightRef.current = true;
    setIsRequestInFlight(true);
    const startMs = performance.now();

    try {
      const response = await apiService.predictImage(frameFile);
      const elapsed = Math.round(performance.now() - startMs);
      setLatencyMs(elapsed);
      setLatestResult(response);

      if (response.faces_detected > 0) {
        const vW = videoRef.current?.videoWidth || 640;
        const vH = videoRef.current?.videoHeight || 480;
        drawOverlay(response.predictions, vW, vH);
      } else {
        if (overlayCanvasRef.current) {
          const ctx = overlayCanvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
      }
    } catch (err: any) {
      console.warn('Frame inference cycle skipped:', err.message);
    } finally {
      inFlightRef.current = false;
      setIsRequestInFlight(false);
    }
  }, [isActive, isLiveInferenceEnabled, captureFrameFile, drawOverlay]);

  // Interval loop for live inference based on targetFps
  useEffect(() => {
    if (isActive && isLiveInferenceEnabled) {
      const intervalMs = Math.round(1000 / targetFps);
      intervalRef.current = setInterval(() => {
        runFrameInference();
      }, intervalMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isLiveInferenceEnabled, targetFps, runFrameInference]);

  // Teardown when component unmounts
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Manual snapshot capture
  const handleCaptureSnapshot = async () => {
    const frameFile = captureFrameFile();
    if (!frameFile) return;

    try {
      const response = await apiService.predictImage(frameFile);
      setSnapshotResult(response);
      toast.success(
        'Snapshot Captured',
        response.faces_detected > 0
          ? `Detected ${response.faces_detected} face(s). Primary: ${response.primary_prediction?.primary_expression}`
          : 'Snapshot captured (no faces detected).'
      );
    } catch (err: any) {
      toast.error('Snapshot Failed', err.message);
    }
  };

  // Active prediction to display in panels
  const activePrediction: FacePrediction | null =
    latestResult?.predictions.find((p) => p.face_id === selectedFaceId) ||
    latestResult?.primary_prediction ||
    null;

  return (
    <div className="space-y-6">
      {/* Hidden canvas for JPEG serialization */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Main Viewport & HUD Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-brand-border bg-slate-950 flex items-center justify-center shadow-2xl">
            {/* Real HTML5 Video Preview */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] ${!isActive ? 'hidden' : 'block'}`}
            />

            {/* Futuristic Canvas Overlay for Bounding Boxes */}
            <canvas
              ref={overlayCanvasRef}
              className={`absolute inset-0 pointer-events-none w-full h-full ${!isActive ? 'hidden' : 'block'}`}
            />

            {/* Inactive State Display */}
            {!isActive && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <CameraOff className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Live Webcam Classification</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Camera stream requires explicit user consent and will never start automatically.
                    Zero video frames or facial biometrics are stored permanently.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={startStream}
                  leftIcon={<Camera className="w-4 h-4" />}
                >
                  Authorize Camera & Start Ingestion
                </Button>
              </div>
            )}

            {/* Active Status Badges Overlay */}
            {isActive && (
              <>
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <Badge variant="pista" size="sm">
                    {targetFps} FPS Stream
                  </Badge>
                  {isRequestInFlight && (
                    <Badge variant="cyan" size="sm" className="animate-pulse">
                      Inferring...
                    </Badge>
                  )}
                </div>

                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                  {latencyMs !== null && (
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur border border-white/10 text-brand-cyan">
                      {latencyMs} ms
                    </span>
                  )}
                  <Badge variant="pista" size="sm">
                    FER-2013: 45.24% Acc
                  </Badge>
                </div>
              </>
            )}
          </div>

          {/* Camera Controls Bar */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-brand-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {!isActive ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={startStream}
                  leftIcon={<Camera className="w-4 h-4" />}
                >
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={stopStream}
                    leftIcon={<CameraOff className="w-4 h-4" />}
                  >
                    Stop Camera
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCaptureSnapshot}
                    leftIcon={<SnapshotIcon className="w-4 h-4" />}
                  >
                    Capture Snapshot
                  </Button>
                  <Button
                    variant={isLiveInferenceEnabled ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => setIsLiveInferenceEnabled(!isLiveInferenceEnabled)}
                  >
                    {isLiveInferenceEnabled ? 'Pause Live' : 'Resume Live'}
                  </Button>
                </>
              )}
            </div>

            {/* Stream Settings */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Rate:</span>
                <select
                  aria-label="Inference sampling rate"
                  value={targetFps}
                  onChange={(e) => setTargetFps(Number(e.target.value))}
                  disabled={!isActive}
                  className="bg-black/40 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-brand-cyan"
                >
                  <option value={1}>1 FPS</option>
                  <option value={2}>2 FPS (Rec)</option>
                  <option value={3}>3 FPS</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Min Conf: {confidenceThreshold}%</span>
                <input
                  aria-label="Confidence threshold"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="w-20 accent-brand-cyan cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold text-rose-200">
                  {permissionState === 'denied' ? 'Camera Permission Denied' : 'Camera Device Error'}
                </p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Real-Time Results & Probability HUD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-brand-darker/90 border border-brand-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-cyan" />
                <h4 className="text-sm font-bold text-slate-100 font-display">
                  Live Neural Classification
                </h4>
              </div>
              <Badge variant="cyan" size="sm">
                Active CNN
              </Badge>
            </div>

            {/* When Camera Active and Prediction Exists */}
            {isActive && latestResult ? (
              <div className="space-y-4">
                {/* Faces Detected Bar */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-brand-cyan" />
                    Faces in View:
                  </span>
                  <Badge variant={latestResult.faces_detected > 0 ? 'pista' : 'amber'} size="sm">
                    {latestResult.faces_detected} Detected
                  </Badge>
                </div>

                {/* Multiple Faces Selector */}
                {latestResult.faces_detected > 1 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-mono text-slate-400">Select Face:</span>
                    <div className="flex gap-1">
                      {latestResult.predictions.map((p) => (
                        <button
                          key={p.face_id}
                          onClick={() => setSelectedFaceId(p.face_id)}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                            selectedFaceId === p.face_id
                              ? 'bg-brand-cyan text-brand-darker font-bold'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          Face #{p.face_id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Face Result Box */}
                {activePrediction ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Visible Expression
                        </span>
                        <EmotionBadge
                          expression={activePrediction.primary_expression as ExpressionClass}
                          className="text-xs px-3 py-1 uppercase font-bold"
                        />
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Confidence
                        </span>
                        <span className="text-lg font-bold font-mono text-brand-cyan">
                          {(activePrediction.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* All 7 Softmax Probabilities Bar Graph */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-brand-cyan" />
                          Softmax Vector (7 Classes)
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {Object.entries(activePrediction.probabilities)
                          .sort(([, a], [, b]) => b - a)
                          .map(([emotion, prob]) => {
                            const isTop = emotion.toLowerCase() === activePrediction.primary_expression.toLowerCase();
                            const pct = (prob * 100).toFixed(1);
                            return (
                              <div key={emotion} className="space-y-0.5">
                                <div className="flex justify-between items-center text-[11px] font-mono">
                                  <span className={`capitalize ${isTop ? 'text-brand-cyan font-bold' : 'text-slate-400'}`}>
                                    {emotion} {isTop && '★'}
                                  </span>
                                  <span className={isTop ? 'text-brand-cyan font-bold' : 'text-slate-500'}>
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isTop ? 'bg-brand-cyan' : 'bg-slate-600'
                                    }`}
                                    style={{ width: `${Math.max(Number(pct), 2)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-200">
                    No human face currently detected in webcam view. Please face the camera directly in good lighting.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-black/20 border border-white/5 text-center space-y-2">
                <p className="text-xs text-slate-300 font-medium">Inference Engine Ready</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Click &ldquo;Authorize Camera & Start Ingestion&rdquo; to begin real-time optical frame evaluation.
                </p>
              </div>
            )}

            {/* Privacy Guarantee Note */}
            <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Zero server frame retention &bull; Client-side isolation</span>
            </div>
          </div>

          {/* Snapshot Result Modal/Card if Captured */}
          {snapshotResult && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-brand-cyan/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Captured Snapshot Result
                </span>
                <button
                  onClick={() => setSnapshotResult(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  &times; Dismiss
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Primary Expression:{' '}
                <strong className="text-brand-cyan capitalize">
                  {snapshotResult.primary_prediction?.primary_expression || 'None'}
                </strong>{' '}
                ({((snapshotResult.primary_prediction?.confidence || 0) * 100).toFixed(1)}% conf)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
