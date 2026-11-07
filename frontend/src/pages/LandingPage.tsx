import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Camera,
  Image as ImageIcon,
  Video,
  BarChart3,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Camera,
      title: 'Live Webcam Classification',
      desc: 'Real-time multi-face tracking and facial expression classification directly in your browser with zero video recording.',
    },
    {
      icon: ImageIcon,
      title: 'High-Resolution Image Analysis',
      desc: 'Deep multi-channel facial region analysis for static images (JPG, PNG, WebP) with localized bounding boxes.',
    },
    {
      icon: Video,
      title: 'Temporal Video Processing',
      desc: 'Frame-by-frame temporal expression classification across continuous video streams and recorded clips.',
    },
    {
      icon: Brain,
      title: 'Custom CNN Architecture',
      desc: '4-stage deep convolutional neural network built with TensorFlow/Keras, optimized for the 7 standard facial emotion classes.',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Probability Analytics',
      desc: 'Granular confidence scores and probability distribution graphs for Angry, Disgust, Fear, Happy, Sad, Surprise, and Neutral.',
    },
    {
      icon: ShieldCheck,
      title: 'Privacy-by-Design Architecture',
      desc: 'Webcam feeds and images are strictly ephemeral. No personal biometric templates or faces are stored permanently.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Input Capture',
      desc: 'User provides media via explicit webcam opt-in, image drag-and-drop, or video upload within secure limits.',
    },
    {
      number: '02',
      title: 'Face Detection & Alignment',
      desc: 'Computer vision algorithms detect facial regions, extract bounding coordinates, and normalize alignment.',
    },
    {
      number: '03',
      title: 'CNN Feature Extraction',
      desc: 'Normalized 48x48 grayscale matrices are processed through stacked convolutional and batch normalization layers.',
    },
    {
      number: '04',
      title: 'Probabilistic Classification',
      desc: 'Softmax activation generates confidence distributions across 7 facial expression categories with visual HUD rendering.',
    },
  ];

  const techStack = [
    { category: 'Frontend', items: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS 3', 'Framer Motion'] },
    { category: 'Backend Engine', items: ['Python 3.10/3.11', 'FastAPI', 'Uvicorn', 'Pydantic v2', 'SQLAlchemy'] },
    { category: 'Vision & Deep Learning', items: ['TensorFlow / Keras', 'OpenCV', 'MediaPipe', 'NumPy'] },
    { category: 'Data & Deployment', items: ['SQLite', 'Docker', 'Vercel Ready', 'Render Ready'] },
  ];

  return (
    <div className="space-y-20 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-b from-brand-card/80 via-brand-navy/60 to-brand-dark/90 p-8 md:p-14 text-center backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
            <span>Phase 1 Architecture Active &bull; Powered by Saniya</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display text-slate-100">
            Facial Emotion Recognizer <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-blue-400 to-indigo-400">AI</span>
          </h1>

          <p className="text-base md:text-xl text-slate-300 font-normal leading-relaxed">
            Understand Facial Expressions with Artificial Intelligence.
          </p>

          <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A modular, enterprise-grade computer vision platform built with custom TensorFlow/Keras CNN architecture. Designed to scientifically evaluate visible facial muscle action units with privacy, transparency, and high performance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/dashboard">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch Studio Dashboard
              </Button>
            </Link>
            <Link to="/live">
              <Button size="lg" variant="outline" leftIcon={<Camera className="w-4 h-4" />}>
                Open Live Webcam
              </Button>
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              7-Class Expression Model
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-brand-cyan" />
              Zero Frame Retention
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              FastAPI + Custom CNN
            </span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="cyan" size="sm">Capabilities</Badge>
          <h2 className="text-2xl font-bold font-display text-slate-100">
            Engineering Precision for Facial Analysis
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
            Engineered as a robust software product with dedicated pipelines for live capture, batch uploads, and analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <Card key={feat.title} variant="default" className="hover:border-brand-cyan/40 hover:-translate-y-0.5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{feat.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{feat.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-8 rounded-3xl border border-brand-border bg-brand-navy/30 p-8 md:p-12">
        <div className="text-center space-y-2">
          <Badge variant="blue" size="sm">Workflow</Badge>
          <h2 className="text-2xl font-bold font-display text-slate-100">
            How The Recognition Pipeline Works
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
            From raw camera frames to probability distributions in 4 deterministic stages.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((st) => (
            <div key={st.number} className="p-5 rounded-xl border border-white/5 bg-brand-card/50 backdrop-blur-sm space-y-3 relative">
              <span className="text-2xl font-extrabold font-mono text-brand-cyan/30">
                {st.number}
              </span>
              <h4 className="text-sm font-semibold text-slate-200">{st.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="pista" size="sm">Architecture</Badge>
          <h2 className="text-2xl font-bold font-display text-slate-100">
            Enterprise Technology Stack
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
            Modern, maintainable technologies selected for speed, stability, and clean separation of concerns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((tech) => (
            <Card key={tech.category} variant="glass" className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-cyan" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  {tech.category}
                </h4>
              </div>
              <ul className="space-y-2">
                {tech.items.map((it) => (
                  <li key={it} className="text-xs text-slate-300 flex items-center gap-2 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/60" />
                    {it}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="rounded-2xl border border-brand-cyan/30 bg-gradient-to-r from-brand-card via-brand-navy to-brand-dark p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle-glow">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold font-display text-slate-100">
            Ready to explore Facial Emotion Recognizer AI?
          </h3>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl">
            Inspect the live Phase 1 foundation, test camera permissions, review the CNN architecture specifications, and explore the analytics interface.
          </p>
        </div>
        <Link to="/dashboard">
          <Button size="lg" variant="primary">
            Explore Dashboard
          </Button>
        </Link>
      </section>
    </div>
  );
};

