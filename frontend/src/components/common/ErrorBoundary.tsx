import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-brand-card/90 border border-rose-500/30 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Application Error Encountered</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              An unexpected client runtime exception occurred. The error details have been logged.
            </p>
            {this.state.error && (
              <div className="mt-4 p-3 bg-black/40 rounded-lg text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32 border border-white/5">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
