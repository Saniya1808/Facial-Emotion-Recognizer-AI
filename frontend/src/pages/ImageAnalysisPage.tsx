import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Dropzone } from '../components/upload/Dropzone';
import { EmotionBadge } from '../components/emotion/EmotionBadge';
import { ExpressionLegend } from '../components/emotion/ExpressionLegend';
import { apiService } from '../services/api';
import { ImagePredictionResponse, FacePrediction, ExpressionClass } from '../types';
import { useToast } from '../hooks/useToast';

export const ImageAnalysisPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<ImagePredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFaceId, setSelectedFaceId] = useState<number>(1);
  const toast = useToast();

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file);
    setResult(null);
    setErrorMessage(null);
    if (file) {
      toast.info('Image Attached', `Loaded "${file.name}" ready for CNN inference.`);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await apiService.predictImage(selectedFile);
      setResult(response);
      if (response.faces_detected > 0) {
        setSelectedFaceId(response.primary_prediction?.face_id || 1);
        toast.success(
          'Analysis Completed',
          `Detected ${response.faces_detected} face(s). Primary expression: ${response.primary_prediction?.primary_expression} (${((response.primary_prediction?.confidence || 0) * 100).toFixed(1)}%).`
        );
      } else {
        toast.warning('No Face Detected', response.message);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to connect to facial expression recognition engine.';
      setErrorMessage(msg);
      toast.error('Analysis Failed', msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
  };

  // Get current active face prediction
  const activeFace: FacePrediction | null =
    result?.predictions.find((p) => p.face_id === selectedFaceId) ||
    result?.primary_prediction ||
    null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-cyan" />
            Static Image Facial Expression Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real custom CNN inference trained on FER-2013 dataset (45.24% test accuracy).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="md">FER-2013 Model: 45.24% Acc</Badge>
          <Badge variant="pista" size="md">TensorFlow / Keras</Badge>
        </div>
      </div>

      {/* Main Upload Dropzone */}
      <Card variant="glass" className="space-y-4">
        <CardHeader>
          <div>
            <CardTitle>Image File Selection</CardTitle>
            <CardDescription>
              Upload a clear photograph with one or more visible human faces (JPEG, PNG, WebP)
            </CardDescription>
          </div>
        </CardHeader>

        <Dropzone
          accept="image/jpeg,image/png,image/webp"
          allowedExtensions={['.jpg', '.jpeg', '.png', '.webp']}
          maxSizeMB={25}
          selectedFile={selectedFile}
          onFileSelected={handleFileSelected}
        />

        {selectedFile && !result && (
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="md" onClick={handleReset}>
              Clear
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAnalyze}
              isLoading={isAnalyzing}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Analyze Facial Expression
            </Button>
          </div>
        )}
      </Card>

      {/* Error Card */}
      {errorMessage && (
        <Card variant="default" className="border-rose-500/30 bg-rose-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-rose-200">Analysis Error</h4>
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

      {/* Zero Faces Detected State */}
      {result && result.faces_detected === 0 && (
        <Card variant="default" className="border-amber-500/30 bg-amber-950/20 p-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">No Human Face Detected</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                {result.message}
              </p>
            </div>
            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={handleReset}>
                Select Another Image
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Actual Prediction Results View */}
      {result && result.faces_detected > 0 && activeFace && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Result Banner */}
          <Card variant="highlight" className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-100">
                    Facial Expression Analysis Result
                  </h3>
                  <Badge variant="pista" size="sm">
                    {result.faces_detected} Face{result.faces_detected > 1 ? 's' : ''} Detected
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  File: <span className="text-slate-200">{result.filename}</span> &bull; Latency:{' '}
                  <span className="text-brand-cyan">{result.processing_time_ms} ms</span>
                </p>
              </div>

              {/* Multi-face Selector (if > 1 face) */}
              {result.faces_detected > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Select Face:</span>
                  <div className="flex gap-1.5">
                    {result.predictions.map((p) => (
                      <button
                        key={p.face_id}
                        onClick={() => setSelectedFaceId(p.face_id)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                          selectedFaceId === p.face_id
                            ? 'bg-brand-cyan text-brand-darker shadow-sm'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        Face #{p.face_id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Prediction Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
              {/* Box 1: Predicted Visible Expression */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Predicted Expression
                </span>
                <div className="flex items-center gap-3">
                  <EmotionBadge
                    expression={activeFace.primary_expression as ExpressionClass}
                    className="text-sm px-3 py-1.5 uppercase font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-snug pt-1">
                  Dominant visible morphological configuration.
                </p>
              </div>

              {/* Box 2: Confidence Score */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Model Confidence
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-brand-cyan">
                    {(activeFace.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({activeFace.confidence.toFixed(4)})
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-cyan rounded-full transition-all duration-500"
                    style={{ width: `${activeFace.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Box 3: Model Benchmark */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Model Accuracy Benchmark
                </span>
                <div>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {(result.model_accuracy_benchmark * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Evaluated on 7,178 test samples from the FER-2013 benchmark.
                </p>
              </div>
            </div>
          </Card>

          {/* Probability Distribution Graph (All 7 Classes) */}
          <Card variant="default" className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>
                  <Layers className="w-4 h-4 text-brand-cyan" />
                  <span>Probability Distribution (7 Target Classes)</span>
                </CardTitle>
                <CardDescription>
                  Full Softmax output vector from the trained Custom CNN
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3 pt-1">
              {Object.entries(activeFace.probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([emotion, prob]) => {
                  const percentage = (prob * 100).toFixed(1);
                  const isTop = emotion.toLowerCase() === activeFace.primary_expression.toLowerCase();
                  return (
                    <div key={emotion} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className={`font-medium capitalize ${isTop ? 'text-brand-cyan font-bold' : 'text-slate-300'}`}>
                          {emotion} {isTop && '★'}
                        </span>
                        <span className={`${isTop ? 'text-brand-cyan font-bold' : 'text-slate-400'}`}>
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop
                              ? 'bg-gradient-to-r from-brand-cyan to-brand-blue shadow-subtle-glow'
                              : 'bg-slate-600/70'
                          }`}
                          style={{ width: `${Math.max(Number(percentage), 1.5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Scientific Disclaimer Card */}
          <Card variant="glass" className="border-brand-cyan/20 p-4">
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <Info className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-200">
                  Scientific Affective Computing Statement
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {result.disclaimer} Visible facial muscle expressions are probabilistic anatomical signals and do not constitute direct verification of subjective personal feelings, psychological moods, or internal intent.
                </p>
              </div>
            </div>
          </Card>

          {/* New Analysis Action */}
          <div className="flex justify-end">
            <Button variant="secondary" size="md" onClick={handleReset}>
              Analyze Another Image
            </Button>
          </div>
        </div>
      )}

      {/* Target Taxonomy Reference */}
      <ExpressionLegend />
    </div>
  );
};
