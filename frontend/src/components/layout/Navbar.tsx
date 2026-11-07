import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Sun, Moon, Sparkles, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { StatusIndicator } from '../common/StatusIndicator';
import { useSystemStatus } from '../../hooks/useSystemStatus';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { backendConnected, backendLoading, modelStatus, refreshStatus } = useSystemStatus(30000);
  const location = useLocation();

  const getPageTitle = (pathname: string): { title: string; subtitle: string } => {
    switch (pathname) {
      case '/dashboard':
        return { title: 'Analytics Dashboard', subtitle: 'System overview & model baseline metrics' };
      case '/live':
        return { title: 'Live Webcam Detection', subtitle: 'Real-time expression stream capture' };
      case '/image':
        return { title: 'Static Image Analysis', subtitle: 'Single-frame facial expression analysis' };
      case '/video':
        return { title: 'Video Sequence Analysis', subtitle: 'Multi-frame temporal emotion processing' };
      case '/history':
        return { title: 'Analysis History', subtitle: 'Previous sessions & verification logs' };
      case '/settings':
        return { title: 'System Settings', subtitle: 'Theme, API endpoints & preferences' };
      case '/help':
        return { title: 'Documentation & Help', subtitle: 'Architecture guide, privacy & limitations' };
      default:
        return { title: 'Facial Emotion Recognizer AI', subtitle: 'Understand Facial Expressions with AI' };
    }
  };

  const pageInfo = getPageTitle(location.pathname);

  return (
    <header className="h-16 px-4 md:px-6 border-b border-brand-border bg-brand-dark/80 dark:bg-brand-darker/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-semibold text-slate-100 tracking-tight">
              {pageInfo.title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded border border-brand-cyan/20">
              <Sparkles className="w-2.5 h-2.5" />
              Phase 1
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Backend and Model Connectivity Pill */}
        <div className="hidden lg:block">
          <StatusIndicator
            backendConnected={backendConnected}
            backendLoading={backendLoading}
            modelStatus={modelStatus?.model_status}
            onRefresh={refreshStatus}
          />
        </div>

        {/* Privacy Pill */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">Privacy First</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-white/5 transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-brand-cyan" />
          )}
        </button>

        {/* Brand Link */}
        <Link
          to="/"
          className="hidden sm:flex text-xs font-mono text-slate-400 hover:text-brand-cyan transition-colors items-center gap-1.5 pl-2 border-l border-white/10"
        >
          <span className="text-[11px] text-slate-400">Powered by</span>
          <span className="text-slate-200 font-semibold">Saniya</span>
        </Link>
      </div>
    </header>
  );
};

