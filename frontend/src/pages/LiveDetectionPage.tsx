import React from 'react';
import { Camera, Shield, Cpu, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { WebcamCapture } from '../components/webcam/WebcamCapture';
import { ExpressionLegend } from '../components/emotion/ExpressionLegend';

export const LiveDetectionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-cyan" />
            Live Webcam Facial Expression Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time optical stream ingestion with client-side media controls, face bounding HUD, and live CNN inference.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="md">
            FER-2013: 45.24% Benchmark
          </Badge>
          <Badge variant="pista" size="md">
            Zero Frame Retention
          </Badge>
        </div>
      </div>

      {/* Main Webcam Capture Console */}
      <Card variant="glass" className="p-6">
        <WebcamCapture />
      </Card>

      {/* Privacy & Architectural Disclosures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="default">
          <CardHeader>
            <CardTitle>
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Camera Privacy & Data Sovereignty</span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Your privacy is fundamental. This application enforces strict client-side isolation:
            </p>
            <ul className="space-y-2 list-disc list-inside text-slate-400 font-mono text-[11px]">
              <li>The webcam will <strong>never start automatically</strong> upon page load.</li>
              <li>Video streams are bounded entirely inside browser memory via HTML5 Canvas/Video.</li>
              <li>No video frames, biometric facial embeddings, or photographs are written to disk.</li>
              <li>You can immediately revoke access at any time with the &ldquo;Stop Camera&rdquo; button.</li>
            </ul>
          </div>
        </Card>

        <Card variant="default">
          <CardHeader>
            <CardTitle>
              <Cpu className="w-4 h-4 text-brand-cyan" />
              <span>Real-Time Inference Architecture</span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              The live stream uses a decoupled sampling architecture to prevent UI freeze and overlapping network requests:
            </p>
            <ul className="space-y-2 list-disc list-inside text-slate-400 font-mono text-[11px]">
              <li>Frames are sampled at a configurable rate (1 to 3 FPS) via HTML5 Canvas.</li>
              <li>An in-flight lock ensures subsequent frame ticks skip until the active request finishes.</li>
              <li>OpenCV Haar cascade localizes all face bounding boxes in each frame.</li>
              <li>Face patches are normalized to 48x48 single-channel grayscale and evaluated by the trained CNN.</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Scientific Affective Computing Disclaimer */}
      <Card variant="glass" className="p-4 border-brand-cyan/20">
        <div className="flex items-start gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">
              Scientific Affective Computing Statement
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              The system classifies visible facial expression patterns into seven FER-2013 categories. It does not determine a person&rsquo;s genuine internal psychological emotional state or subjective intent. Softmax confidence scores reflect model activation over the FER-2013 dataset and are not calibrated Bayesian probabilities.
            </p>
          </div>
        </div>
      </Card>

      {/* Expression Classes Reference */}
      <ExpressionLegend />
    </div>
  );
};
