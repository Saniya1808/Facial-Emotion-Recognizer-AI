import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold font-display text-slate-100">404 - Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
        The requested routing view does not exist in Facial Emotion Recognizer AI.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
          Return to Overview
        </Button>
      </Link>
    </div>
  );
};

