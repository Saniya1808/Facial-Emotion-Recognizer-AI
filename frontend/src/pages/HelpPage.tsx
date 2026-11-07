import React from 'react';
import { HelpCircle, BookOpen, AlertTriangle, Cpu, Terminal } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ExpressionLegend } from '../components/emotion/ExpressionLegend';

export const HelpPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-cyan" />
            Documentation, Ethics & Limitations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            System architectural guidelines, user instructions, and ethical AI disclosures.
          </p>
        </div>

        <Badge variant="cyan" size="md">Version 0.1.0</Badge>
      </div>

      {/* Ethical AI & Core Scientific Limitation Statement */}
      <Card variant="highlight" className="border-brand-cyan/40 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100">
            Crucial Scientific Principle & Limitation
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Visible Expression vs. Internal Emotional State:</strong> Facial Emotion Recognizer AI is explicitly designed to describe and categorize <em>visible morphological facial muscle movements and Action Units (AUs)</em>.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          In alignment with modern affective science and psychology (e.g. Barrett et al., 2019), facial configurations alone do not have a 1:1 deterministic relationship with a person&apos;s subjective psychological state, inner emotional experience, or intent. This system makes <strong>no claim</strong> to read minds or infer true human emotional feelings.
        </p>
      </Card>

      {/* Feature Documentation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="default">
          <CardHeader>
            <CardTitle>
              <BookOpen className="w-4 h-4 text-brand-cyan" />
              <span>Input Modes & Capabilities</span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-3 text-xs text-slate-300">
            <div>
              <h4 className="font-semibold text-slate-200">1. Live Webcam</h4>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Requires user permission. Captures HTML5 canvas frames, conducts browser-level bounding checks, and terminates cleanly when stopped.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">2. Static Image Upload</h4>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Accepts JPEG, PNG, and WebP files up to 25 MB. Verifies dimensions and handles multi-face bounding normalization.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">3. Video Sequences</h4>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Accepts MP4, WebM, and MOV containers up to 25 MB. Uses temporal downsampling (5-10 fps) to smooth expression trends.
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <CardHeader>
            <CardTitle>
              <Cpu className="w-4 h-4 text-brand-blue" />
              <span>Custom CNN Model Specifications</span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-3 text-xs text-slate-300">
            <div>
              <h4 className="font-semibold text-slate-200">Deep Learning Architecture</h4>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Built with TensorFlow/Keras. Composed of 4 sequential convolutional blocks: Conv2D (32, 64, 128, 256 filters) with Batch Normalization, ReLU activation, MaxPooling2D, and Spatial Dropout (0.25 - 0.5) to mitigate overfitting.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">Input Geometry</h4>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Expects 48x48 pixel grayscale tensors normalized between [0, 1]. Output is a 7-dimensional softmax probability vector.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">Phase 1 Readiness</h4>
              <p className="text-amber-300 text-[11px] mt-0.5 leading-relaxed">
                Architecture specified in software contracts; status reported truthfully as <code className="font-mono">not_trained</code>.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* API Reference & Commands */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>
            <Terminal className="w-4 h-4 text-brand-cyan" />
            <span>Developer Commands & API Reference</span>
          </CardTitle>
          <Badge variant="pista" size="sm">FastAPI + Vitest</Badge>
        </CardHeader>

        <div className="space-y-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
            <p className="text-slate-400 text-[11px]"># Start FastAPI Backend Service</p>
            <p className="text-brand-cyan">uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload</p>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
            <p className="text-slate-400 text-[11px]"># Start React Vite Frontend</p>
            <p className="text-brand-cyan">cd frontend && npm run dev</p>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
            <p className="text-slate-400 text-[11px]"># Run Backend Pytest Suite</p>
            <p className="text-brand-cyan">pytest -v tests/backend</p>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
            <p className="text-slate-400 text-[11px]"># Run Frontend Vitest Suite</p>
            <p className="text-brand-cyan">cd frontend && npm test</p>
          </div>
        </div>
      </Card>

      {/* Target Expression Taxonomy */}
      <ExpressionLegend />
    </div>
  );
};
