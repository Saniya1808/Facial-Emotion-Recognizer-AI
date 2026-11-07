import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  Image as ImageIcon,
  Video,
  History,
  Settings,
  HelpCircle,
  Home,
  ChevronLeft,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSystemStatus } from '../../hooks/useSystemStatus';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { modelStatus } = useSystemStatus(30000);
  const isTrained = modelStatus?.model_status === 'trained';

  const navItems = [
    { label: 'Overview', path: '/', icon: Home },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Webcam', path: '/live', icon: Camera },
    { label: 'Image Analysis', path: '/image', icon: ImageIcon },
    { label: 'Video Analysis', path: '/video', icon: Video },
    { label: 'History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Help & Docs', path: '/help', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-brand-border bg-brand-navy/95 dark:bg-brand-darker/95 backdrop-blur-xl transition-all duration-300 ease-in-out',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-brand-border justify-between">
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center text-brand-darker flex-shrink-0 shadow-subtle-glow group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 font-bold" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-slate-100 truncate font-display">
                  FER <span className="text-brand-cyan">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 truncate tracking-wide font-mono">
                  Powered by Saniya
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                    isActive
                      ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0 transition-colors',
                        isActive ? 'text-brand-cyan' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}

                    {/* Active highlight pill */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-brand-cyan shadow-subtle-glow" />
                    )}

                    {/* Tooltip on collapsed desktop */}
                    {collapsed && (
                      <div className="hidden lg:group-hover:block absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-slate-100 text-xs rounded-md shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Brand Identity */}
        <div className="p-3 border-t border-brand-border">
          {!collapsed ? (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                  Engine Status
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${isTrained ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}
                  title={isTrained ? 'Model Trained (FER-2013)' : 'Model Not Trained'}
                />
              </div>
              <p className="text-xs text-slate-200 font-medium mt-1">
                {isTrained ? 'Inference Active' : 'Phase 1: Architecture'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug font-mono">
                {isTrained ? 'CNN: Trained (45.24%)' : 'CNN: Not Trained'}
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-2" title={isTrained ? 'Model Trained' : 'Model Not Trained'}>
              <span className={`w-2.5 h-2.5 rounded-full ${isTrained ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
